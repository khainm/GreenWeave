using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth.OAuth2;
using System.Net.Http.Headers;

[ApiController]
[Route("api/[controller]")]
public class AiCartoonController : ControllerBase
{
    private readonly ILogger<AiCartoonController> _logger;

    // ⚙️ Cấu hình
    private readonly string projectId = "gen-lang-client-0171725325";
    private readonly string location = "global";
    private readonly string model = "gemini-2.5-flash-image-preview";
    private readonly string? credentialPath;
    private readonly bool credentialsAvailable;
    
    // 🚀 Performance: Cache access token (valid for ~1 hour)
    private static string? _cachedToken;
    private static DateTime _tokenExpiry = DateTime.MinValue;
    private static readonly SemaphoreSlim _tokenLock = new SemaphoreSlim(1, 1);
    
    // ⚙️ Retry configuration
    private const int MaxRetries = 3;
    private const int InitialRetryDelayMs = 1000; // 1 second

    public AiCartoonController(ILogger<AiCartoonController> logger)
    {
        _logger = logger;

        // ✅ Check if credentials are available in environment variable
        var credentialContent = Environment.GetEnvironmentVariable("GOOGLE_CREDENTIAL_CONTENT");
        if (string.IsNullOrEmpty(credentialContent))
        {
            _logger.LogWarning("⚠️ GOOGLE_CREDENTIAL_CONTENT environment variable is not set - AI features will be disabled");
            credentialsAvailable = false;
            credentialPath = null;
        }
        else
        {
            credentialsAvailable = true;
            credentialPath = credentialContent; // Store JSON content directly, not file path
            _logger.LogInformation("✅ [AiCartoon] Google credentials loaded from environment variable");
        }
    }

    // ✅ Lấy access token từ service account với caching
    private async Task<string> GetAccessTokenAsync()
    {
        if (!credentialsAvailable || string.IsNullOrEmpty(credentialPath))
        {
            throw new InvalidOperationException("Google credentials not configured");
        }

        // 🚀 Return cached token if still valid (expires in 55 minutes)
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
        {
            _logger.LogDebug("✅ [AiCartoon] Using cached access token (expires in {Minutes} minutes)", 
                (_tokenExpiry - DateTime.UtcNow).TotalMinutes);
            return _cachedToken;
        }

        await _tokenLock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
                return _cachedToken;

            _logger.LogInformation("🔄 [AiCartoon] Fetching new access token...");
#pragma warning disable CS0618
            var credential = await GoogleCredential
                .FromJson(credentialPath) // credentialPath now contains JSON content
                .CreateScoped("https://www.googleapis.com/auth/cloud-platform")
                .UnderlyingCredential
                .GetAccessTokenForRequestAsync();
#pragma warning restore CS0618

            _cachedToken = credential;
            _tokenExpiry = DateTime.UtcNow.AddMinutes(55); // Google tokens valid for 1 hour, refresh at 55min
            _logger.LogInformation("✅ [AiCartoon] New access token cached until {Expiry}", _tokenExpiry);
            
            return credential;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [AiCartoon] Failed to get access token");
            throw;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    // 🎨 Cartoon Preview - 1 ảnh đầu vào
    [HttpPost("cartoon-preview")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> CartoonPreview([FromForm] IFormFile image)
    {
        try
        {
            // ✅ Check if credentials are available
            if (!credentialsAvailable || string.IsNullOrEmpty(credentialPath))
            {
                _logger.LogError("❌ [AiCartoon] Google credentials not configured");
                return StatusCode(503, new { 
                    error = "AI service is temporarily unavailable", 
                    details = "Google credentials not configured on server. Please contact administrator." 
                });
            }

            if (image == null)
            {
                _logger.LogWarning("⚠️ [AiCartoon] No image provided in request");
                return BadRequest(new { error = "Missing input image" });
            }

            _logger.LogInformation("🎨 [AiCartoon] Processing cartoon preview request, image size: {Size} bytes", image.Length);

            // 🖼️ Đọc ảnh input
            byte[] imgBytes;
            using (var ms = new MemoryStream())
            {
                await image.CopyToAsync(ms);
                imgBytes = ms.ToArray();
            }

            string base64Image = Convert.ToBase64String(imgBytes);

            // 🪄 Prompt mô tả phong cách
            string prompt =
//            "Remove the background from any uploaded character or person images, keeping only the main subject with clean, natural edges. " +
// "Arrange all elements (images, text, stickers) on the tote bag in a balanced, visually appealing composition. " +
// "Create a perfectly realistic and well-proportioned tote bag product image with a clean, professional appearance. " +
// "Ensure that all stickers, text, and colors appear exactly as designed by the customer, but you may creatively adjust the layout and size for better harmony. " +
// "The final image should look photorealistic, production-ready, and naturally lit, as if professionally photographed.";
     


     "Create a modern, stylish, and realistic tote bag product image inspired by the customer’s original design idea. The new tote should reflect current fashion trends and present a fresh freestyle reinterpretation of the old concept — not a strict replication." +

"Rearrange all existing design elements (such as people, stickers, and text) into new, aesthetically pleasing positions with natural proportions and balanced composition. Freely adjust the layout, scale, and angles to achieve a visually harmonious result that feels trendy and artistic."+

"If there are people in the design, remove their backgrounds, neatly cut the edges, and transform them into high-quality cartoon-style characters. Maintain the original stickers, colors, and texts from the customer’s design, but reposition them creatively for better visual appeal."+

"Ensure the final tote bag looks photorealistic, production-ready, and beautifully modern, as if it were a real fashion product photoshoot.";           



            // 🧠 Body gửi tới Gemini
            var body = new
            {
                contents = new[]
                {
                    new {
                        role = "user",
                        parts = new object[]
                        {
                            new { inline_data = new { mime_type = "image/png", data = base64Image } },
                            new { text = prompt }
                        }
                    }
                },
                generation_config = new {
                    response_modalities = new[] { "IMAGE" },
                    temperature = 0.7
                }
            };

            var json = JsonSerializer.Serialize(body);
            _logger.LogInformation("📤 Gemini cartoon request sent");

            // 🚀 Gửi request với retry logic
            var url = $"https://aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/{model}:generateContent";
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            HttpResponseMessage? response = null;
            string? jsonResponse = null;
            
            for (int attempt = 1; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(60) }; // 60s timeout
                    var token = await GetAccessTokenAsync();
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    _logger.LogInformation("📤 [AiCartoon] Sending request to Gemini (attempt {Attempt}/{MaxRetries})...", attempt, MaxRetries);
                    response = await client.PostAsync(url, content);
                    jsonResponse = await response.Content.ReadAsStringAsync();
                    
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("✅ Gemini response received, length: {Length}", jsonResponse.Length);
                        break; // Success!
                    }
                    
                    // Handle rate limiting (429) with exponential backoff
                    if ((int)response.StatusCode == 429 && attempt < MaxRetries)
                    {
                        var retryDelay = InitialRetryDelayMs * (int)Math.Pow(2, attempt - 1); // 1s, 2s, 4s
                        _logger.LogWarning("⏱️ [AiCartoon] Rate limited (429). Retrying in {Delay}ms... (attempt {Attempt}/{MaxRetries})", 
                            retryDelay, attempt, MaxRetries);
                        await Task.Delay(retryDelay);
                        continue;
                    }
                    
                    // Other errors
                    _logger.LogError("❌ [AiCartoon] Gemini API error {StatusCode}: {Response}", response.StatusCode, jsonResponse);
                    
                    if (attempt < MaxRetries)
                    {
                        var retryDelay = InitialRetryDelayMs * attempt;
                        _logger.LogInformation("🔄 Retrying in {Delay}ms...", retryDelay);
                        await Task.Delay(retryDelay);
                    }
                }
                catch (TaskCanceledException)
                {
                    _logger.LogError("⏰ [AiCartoon] Request timeout (60s) on attempt {Attempt}", attempt);
                    if (attempt == MaxRetries)
                        return StatusCode(504, new { error = "Request timeout", message = "AI processing took too long. Please try again." });
                    await Task.Delay(InitialRetryDelayMs * attempt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [AiCartoon] Request failed on attempt {Attempt}", attempt);
                    if (attempt == MaxRetries)
                        throw;
                    await Task.Delay(InitialRetryDelayMs * attempt);
                }
            }
            
            if (response == null || jsonResponse == null)
                return StatusCode(500, new { error = "Failed to get response from Gemini API after retries" });
                
            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = (int)response.StatusCode == 429 
                    ? "Too many requests. Please wait a moment and try again."
                    : "AI service temporarily unavailable. Please try again later.";
                    
                return StatusCode((int)response.StatusCode, new { 
                    error = errorMessage, 
                    statusCode = (int)response.StatusCode,
                    details = jsonResponse 
                });
            }

            // 📦 Parse JSON và hỗ trợ cả inline_data / inlineData + nested parts
            using var doc = JsonDocument.Parse(jsonResponse);

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates))
                return BadRequest(new { error = "Gemini did not return candidates", details = jsonResponse });

            foreach (var candidate in candidates.EnumerateArray())
            {
                if (!candidate.TryGetProperty("content", out var contentEl)) continue;
                if (!contentEl.TryGetProperty("parts", out var parts)) continue;

                // Duyệt tất cả parts cấp 1
                foreach (var part in parts.EnumerateArray())
                {
                    if (TryExtractBase64(part, out var b64))
                        return Ok(new { imageBase64 = b64 });

                    // Kiểm tra cấp 2 (nested)
                    if (part.TryGetProperty("content", out var innerContent) &&
                        innerContent.TryGetProperty("parts", out var innerParts))
                    {
                        foreach (var innerPart in innerParts.EnumerateArray())
                        {
                            if (TryExtractBase64(innerPart, out var nestedB64))
                                return Ok(new { imageBase64 = nestedB64 });
                        }
                    }
                }
            }

            // ❌ Không có ảnh
            _logger.LogError("❌ No image found in Gemini response");
            return StatusCode(500, new { error = "Gemini did not return image", details = jsonResponse });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Gemini cartoon-preview failed");
            return StatusCode(500, new { 
                error = "AI processing failed", 
                message = ex.Message,
                suggestion = "Please try again with a smaller image or different format"
            });
        }
    }
    


    // ✅ Hàm tiện ích trích xuất ảnh base64 từ inlineData / inline_data
    private bool TryExtractBase64(JsonElement element, out string? base64)
    {
        base64 = null;

        JsonElement inlineData;
        if (element.TryGetProperty("inlineData", out inlineData) ||
            element.TryGetProperty("inline_data", out inlineData))
        {
            if (inlineData.TryGetProperty("data", out var dataProp))
            {
                var data = dataProp.GetString();
                if (!string.IsNullOrEmpty(data))
                {
                    _logger.LogInformation("✅ Extracted image base64 (length={Len})", data.Length);
                    base64 = data;
                    return true;
                }
            }
        }

        return false;
    }
}
