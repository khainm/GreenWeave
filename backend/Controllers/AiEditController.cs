using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
public class AiEditController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private const string HfEndpoint = "https://selfit-multi-image-edit.hf.space/api/predict/";

    public AiEditController(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [HttpPost("multi-image-edit")]
    public async Task<IActionResult> MultiImageEdit([FromForm] IFormFile image1, [FromForm] IFormFile? image2, [FromForm] string prompt)
    {
        Console.WriteLine("🚀 [AI Edit] Request received.");

        async Task<string> ToBase64(IFormFile file)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return Convert.ToBase64String(ms.ToArray());
        }

        try
        {
            var img1Base64 = await ToBase64(image1);
            var images = new List<string> { img1Base64 };

            if (image2 != null)
            {
                var img2Base64 = await ToBase64(image2);
                images.Add(img2Base64);
            }

            // 🔧 Build correct HF payload for Gradio 4.x Spaces
            var payload = new
            {
                data = new object[]
                {
                    images.ToArray(), // image1, image2 (base64)
                    prompt
                },
                fn_index = 0, // ✅ Most Spaces have fn_index = 0
                session_hash = Guid.NewGuid().ToString("N")
            };

            var json = JsonSerializer.Serialize(payload);
            Console.WriteLine("📦 Sending payload to HF:");
            Console.WriteLine(json.Substring(0, Math.Min(400, json.Length))); // print first 400 chars

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(HfEndpoint, content);
            var rawResult = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"🌐 HF Response Code: {response.StatusCode}");
            Console.WriteLine($"📨 HF Response Body: {rawResult.Substring(0, Math.Min(400, rawResult.Length))}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    error = "HF API call failed",
                    status = response.StatusCode.ToString(),
                    details = rawResult
                });
            }

            using var jsonDoc = JsonDocument.Parse(rawResult);
            var root = jsonDoc.RootElement;

            if (!root.TryGetProperty("data", out var dataElement))
            {
                return StatusCode(500, new
                {
                    error = "Unexpected HF response format",
                    raw = rawResult
                });
            }

            var base64Image = dataElement[0].GetString();

            return Ok(new { imageBase64 = base64Image });
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ Exception in MultiImageEdit:");
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                error = "Internal server error",
                details = ex.Message,
                stack = ex.StackTrace
            });
        }
    }
}
