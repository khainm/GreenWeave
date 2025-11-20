using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
public class AiEditController : ControllerBase
{
    private readonly ILogger<AiEditController> _logger;

    // ✅ Config
    private readonly string projectId = "gen-lang-client-0171725325";
    private readonly string location = "global";
    private readonly string model = "gemini-2.5-flash-image-preview";
    private readonly string? serviceAccountJsonPath;
    private readonly bool credentialsAvailable;
    
    // 🚀 Performance: Cache access token (shared with AiCartoonController)
    private static string? _cachedToken;
    private static DateTime _tokenExpiry = DateTime.MinValue;
    private static readonly SemaphoreSlim _tokenLock = new SemaphoreSlim(1, 1);
    
    // ⚙️ Retry configuration
    private const int MaxRetries = 3;
    private const int InitialRetryDelayMs = 1000;

    public AiEditController(ILogger<AiEditController> logger)
    {
        _logger = logger;

        // ✅ Load credentials from environment variable
        var credentialContent = Environment.GetEnvironmentVariable("GOOGLE_CREDENTIAL_CONTENT");
        if (string.IsNullOrEmpty(credentialContent))
        {
            _logger.LogWarning("⚠️ GOOGLE_CREDENTIAL_CONTENT environment variable is not set - AI features will be disabled");
            credentialsAvailable = false;
            serviceAccountJsonPath = null;
            return;
        }

        try
        {
            // ✅ Write credentials to temp file with unique name to avoid conflicts
            var tempFilePath = Path.Combine(Path.GetTempPath(), $"google-credentials-edit-{Guid.NewGuid()}.json");
            System.IO.File.WriteAllText(tempFilePath, credentialContent);
            serviceAccountJsonPath = tempFilePath;
            credentialsAvailable = true;
            _logger.LogInformation("✅ [AiEdit] Google credentials loaded successfully to {Path}", tempFilePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [AiEdit] Failed to write Google credentials to temp file");
            credentialsAvailable = false;
            serviceAccountJsonPath = null;
        }
    }

    // ✅ Lấy access token từ service account với caching
    private async Task<string> GetAccessTokenAsync()
    {
        if (!credentialsAvailable || string.IsNullOrEmpty(serviceAccountJsonPath))
        {
            throw new InvalidOperationException("Google credentials not configured");
        }

        // 🚀 Return cached token if still valid
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
        {
            _logger.LogDebug("✅ [AiEdit] Using cached access token (expires in {Minutes} minutes)", 
                (_tokenExpiry - DateTime.UtcNow).TotalMinutes);
            return _cachedToken;
        }

        await _tokenLock.WaitAsync();
        try
        {
            // Double-check after acquiring lock
            if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
                return _cachedToken;

            _logger.LogInformation("🔄 [AiEdit] Fetching new access token...");
            var scopes = new[] { "https://www.googleapis.com/auth/cloud-platform" };
#pragma warning disable CS0618
            var cred = GoogleCredential.FromFile(serviceAccountJsonPath).CreateScoped(scopes);
#pragma warning restore CS0618
            var token = await cred.UnderlyingCredential.GetAccessTokenForRequestAsync();
            
            _cachedToken = token;
            _tokenExpiry = DateTime.UtcNow.AddMinutes(55);
            _logger.LogInformation("✅ [AiEdit] New access token cached until {Expiry}", _tokenExpiry);
            
            return token!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [AiEdit] Failed to get access token");
            throw;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    [HttpPost("multi-image-edit")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> MultiImageEdit(
        [FromForm] IFormFile image1, // người
        [FromForm] IFormFile? image2, // sản phẩm
        [FromForm] string prompt)
    {
        try
        {
            // ✅ Check if credentials are available
            if (!credentialsAvailable || string.IsNullOrEmpty(serviceAccountJsonPath))
            {
                _logger.LogError("❌ [AiEdit] Google credentials not configured");
                return StatusCode(503, new { 
                    error = "AI service is temporarily unavailable", 
                    details = "Google credentials not configured on server. Please contact administrator." 
                });
            }

            if (image1 == null)
            {
                _logger.LogWarning("⚠️ [AiEdit] No image1 provided in request");
                return BadRequest(new { error = "Missing image1 (person)" });
            }

            _logger.LogInformation("🎨 [AiEdit] Processing multi-image edit request, image1 size: {Size} bytes, has image2: {HasImage2}", 
                image1.Length, image2 != null);

            // 🧩 Chuyển ảnh -> Base64
            string img1Base64, img2Base64 = "";
            string mime1 = image1.ContentType ?? "image/png";
            string mime2 = image2?.ContentType ?? "image/png";

            using (var ms = new MemoryStream())
            {
                await image1.CopyToAsync(ms);
                img1Base64 = Convert.ToBase64String(ms.ToArray());
            }
            if (image2 != null)
            {
                using var ms2 = new MemoryStream();
                await image2.CopyToAsync(ms2);
                img2Base64 = Convert.ToBase64String(ms2.ToArray());
            }

            // 🧠 Gộp thành mảng parts
            var parts = new List<object>
            {
                new { inline_data = new { mime_type = mime1, data = img1Base64 } }
            };

            if (!string.IsNullOrEmpty(img2Base64))
                parts.Add(new { inline_data = new { mime_type = mime2, data = img2Base64 } });

            parts.Add(new { text = prompt });

            var body = new
            {
                contents = new[]
                {
                    new { role = "user", parts = parts }
                },
                generation_config = new
                {
                    response_modalities = new[] { "IMAGE" },
                    candidate_count = 1
                }
            };

            var json = JsonSerializer.Serialize(body);
            _logger.LogInformation("📤 Gemini Request sent");

            // 🚀 Gửi request tới Gemini API với retry logic
            var url = $"https://aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/{model}:generateContent";
            HttpResponseMessage? resp = null;
            string? respText = null;
            
            for (int attempt = 1; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    var token = await GetAccessTokenAsync();
                    using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
                    http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                    _logger.LogInformation("📤 [AiEdit] Sending request to Gemini (attempt {Attempt}/{MaxRetries})...", attempt, MaxRetries);
                    resp = await http.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));
                    respText = await resp.Content.ReadAsStringAsync();

                    _logger.LogInformation("📥 Gemini API Response Status: {StatusCode}", resp.StatusCode);
                    _logger.LogInformation("📥 Response length: {Length} characters", respText.Length);

                    if (resp.IsSuccessStatusCode)
                        break; // Success!
                    
                    // Handle rate limiting
                    if ((int)resp.StatusCode == 429 && attempt < MaxRetries)
                    {
                        var retryDelay = InitialRetryDelayMs * (int)Math.Pow(2, attempt - 1);
                        _logger.LogWarning("⏱️ [AiEdit] Rate limited (429). Retrying in {Delay}ms...", retryDelay);
                        await Task.Delay(retryDelay);
                        continue;
                    }
                    
                    _logger.LogError("Gemini API Error: {StatusCode} - {Response}", resp.StatusCode, respText);
                    if (attempt < MaxRetries)
                    {
                        await Task.Delay(InitialRetryDelayMs * attempt);
                    }
                }
                catch (TaskCanceledException)
                {
                    _logger.LogError("⏰ [AiEdit] Request timeout on attempt {Attempt}", attempt);
                    if (attempt == MaxRetries)
                        return StatusCode(504, new { error = "Request timeout", message = "AI processing took too long" });
                    await Task.Delay(InitialRetryDelayMs * attempt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [AiEdit] Request failed on attempt {Attempt}", attempt);
                    if (attempt == MaxRetries)
                        throw;
                    await Task.Delay(InitialRetryDelayMs * attempt);
                }
            }
            
            if (resp == null || respText == null)
                return StatusCode(500, new { error = "Failed to get response from Gemini API" });
                
            if (!resp.IsSuccessStatusCode)
            {
                var errorMessage = (int)resp.StatusCode == 429
                    ? "Too many requests. Please wait and try again."
                    : "AI service temporarily unavailable";
                return StatusCode((int)resp.StatusCode, new { error = errorMessage, details = respText });
            }

            // 💾 Save raw response to file for debugging
            try
            {
                var logPath = Path.Combine(Path.GetTempPath(), $"gemini_response_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                await System.IO.File.WriteAllTextAsync(logPath, respText);
                _logger.LogInformation("💾 Saved raw response to: {Path}", logPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to save response to file: {Error}", ex.Message);
            }

            // ✅ Parse JSON an toàn
            using var doc = JsonDocument.Parse(respText);
            
            _logger.LogInformation("🔍 Starting JSON parsing...");
            
            if (doc.RootElement.TryGetProperty("candidates", out var cands) && cands.GetArrayLength() > 0)
            {
                _logger.LogInformation("✅ Found {Count} candidate(s)", cands.GetArrayLength());
                var cand = cands[0];

                // Gemini 2.5 Flash Image trả về: candidates[0].content.parts[0].inline_data.data
                if (cand.TryGetProperty("content", out var contentEl))
                {
                    _logger.LogInformation("✅ Found 'content' property, type: {Type}", contentEl.ValueKind);

                    // ✅ Gemini trả content là object với parts array
                    if (contentEl.ValueKind == JsonValueKind.Object && contentEl.TryGetProperty("parts", out var partsEl))
                    {
                        _logger.LogInformation("✅ Found 'parts' array with {Count} part(s)", partsEl.GetArrayLength());
                        
                        foreach (var p in partsEl.EnumerateArray())
                        {
                            // ✅ Thử cả camelCase và snake_case vì Gemini API có thể dùng cả hai
                            JsonElement inlineData;
                            bool hasInlineData = p.TryGetProperty("inlineData", out inlineData) ||
                                                p.TryGetProperty("inline_data", out inlineData);
                            
                            if (hasInlineData)
                            {
                                _logger.LogInformation("✅ Found 'inlineData' in part");
                                
                                // ✅ Thử cả camelCase và snake_case cho mimeType
                                if (inlineData.TryGetProperty("mimeType", out var mimeType) ||
                                    inlineData.TryGetProperty("mime_type", out mimeType))
                                {
                                    _logger.LogInformation("📄 MIME type: {MimeType}", mimeType.GetString());
                                }
                                
                                if (inlineData.TryGetProperty("data", out var dataProp))
                                {
                                    string? b64 = dataProp.GetString();
                                    if (!string.IsNullOrEmpty(b64))
                                    {
                                        _logger.LogInformation("✅ Image base64 extracted successfully!");
                                        _logger.LogInformation("📊 Base64 length: {Length} characters", b64.Length);
                                        _logger.LogInformation("📊 First 50 chars: {Preview}", b64.Length > 50 ? b64.Substring(0, 50) : b64);
                                        _logger.LogInformation("📊 Last 50 chars: {Preview}", b64.Length > 50 ? b64.Substring(b64.Length - 50) : b64);
                                        
                                        return Ok(new { imageBase64 = b64 });
                                    }
                                    else
                                    {
                                        _logger.LogWarning("⚠️ Base64 data is null or empty");
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning("⚠️ No 'data' property in inlineData");
                                    _logger.LogWarning("⚠️ inlineData properties: {Props}", string.Join(", ", inlineData.EnumerateObject().Select(p => p.Name)));
                                }
                            }
                            else
                            {
                                _logger.LogWarning("⚠️ Part does not have 'inlineData', properties: {Props}", string.Join(", ", p.EnumerateObject().Select(prop => prop.Name)));
                            }
                        }
                    }
                    else
                    {
                        _logger.LogError("⚠️ Unexpected content format. Expected object with 'parts' property");
                        _logger.LogError("⚠️ Content properties: {Props}", string.Join(", ", contentEl.EnumerateObject().Select(p => p.Name)));
                    }
                }
                else
                {
                    _logger.LogError("⚠️ No 'content' property in candidate");
                    _logger.LogError("⚠️ Candidate properties: {Props}", string.Join(", ", cand.EnumerateObject().Select(p => p.Name)));
                }
            }
            else
            {
                _logger.LogError("⚠️ No candidates in response or empty array");
            }

            // ❌ Không có ảnh
            _logger.LogError("❌ Gemini API did not return an image: {Response}", respText);
            return StatusCode(500, new { error = "Gemini did not return image", details = respText });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Gemini API error");
            return StatusCode(500, new { 
                error = "AI processing failed", 
                message = ex.Message,
                suggestion = "Please try again or contact support if the issue persists"
            });
        }
    }
    
    // 🧹 Cleanup temp credential file
    public void Dispose()
    {
        try
        {
            if (!string.IsNullOrEmpty(serviceAccountJsonPath) && System.IO.File.Exists(serviceAccountJsonPath))
            {
                System.IO.File.Delete(serviceAccountJsonPath);
                _logger.LogDebug("🧹 Cleaned up temp credential file: {Path}", serviceAccountJsonPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup temp credential file");
        }
    }
}
