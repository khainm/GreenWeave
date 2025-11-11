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

    public AiCartoonController(ILogger<AiCartoonController> logger)
    {
        _logger = logger;

        // ✅ Load credentials from environment variable
        var credentialContent = Environment.GetEnvironmentVariable("GOOGLE_CREDENTIAL_CONTENT");
        if (string.IsNullOrEmpty(credentialContent))
        {
            _logger.LogWarning("⚠️ GOOGLE_CREDENTIAL_CONTENT environment variable is not set - AI features will be disabled");
            credentialsAvailable = false;
            credentialPath = null;
            return;
        }

        try
        {
            // ✅ Write credentials to temp file
            var tempFilePath = Path.Combine(Path.GetTempPath(), $"google-credentials-cartoon-{Guid.NewGuid()}.json");
            System.IO.File.WriteAllText(tempFilePath, credentialContent);
            credentialPath = tempFilePath;
            credentialsAvailable = true;
            _logger.LogInformation("✅ [AiCartoon] Google credentials loaded successfully to {Path}", tempFilePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [AiCartoon] Failed to write Google credentials to temp file");
            credentialsAvailable = false;
            credentialPath = null;
        }
    }

    // ✅ Lấy access token từ service account
    private async Task<string> GetAccessTokenAsync()
    {
        if (!credentialsAvailable || string.IsNullOrEmpty(credentialPath))
        {
            throw new InvalidOperationException("Google credentials not configured");
        }

        try
        {
#pragma warning disable CS0618 // Type or member is obsolete
            var credential = await GoogleCredential
                .FromFile(credentialPath)
                .CreateScoped("https://www.googleapis.com/auth/cloud-platform")
                .UnderlyingCredential
                .GetAccessTokenForRequestAsync();
#pragma warning restore CS0618

            return credential;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [AiCartoon] Failed to get access token");
            throw;
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

            // 🚀 Gửi request
            using var client = new HttpClient();
            var token = await GetAccessTokenAsync();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"https://aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/{model}:generateContent";

            var response = await client.PostAsync(url, content);
            var jsonResponse = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("✅ Gemini response received, length: {Length}", jsonResponse.Length);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = "Gemini API Error", details = jsonResponse });

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
            return StatusCode(500, new { error = ex.Message });
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
