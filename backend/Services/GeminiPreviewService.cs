using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using backend.Interfaces.Services;

namespace backend.Services
{
    /// <summary>
    /// Implementation of Gemini API integration for generating preview images
    /// Uses Gemini Vision API to analyze designs and generate cartoon-style transformations
    /// </summary>
    public class GeminiPreviewService : IGeminiPreviewService
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiPreviewService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _geminiApiKey;
        private readonly string _geminiBaseUrl;
        private readonly string _geminiModel;

        public GeminiPreviewService(
            ICloudinaryService cloudinaryService,
            IConfiguration configuration,
            ILogger<GeminiPreviewService> logger,
            HttpClient httpClient)
        {
            _cloudinaryService = cloudinaryService;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
            _geminiApiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is required");
            _geminiBaseUrl = configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta";
            _geminiModel = configuration["Gemini:Model"] ?? "gemini-1.5-flash";
        }

        public async Task<GeminiPreviewResult> GeneratePreviewAsync(Stream imageStream, string fileName)
        {
            try
            {
                _logger.LogInformation("Starting Gemini preview generation for {FileName}", fileName);

                // Step 1: Upload original image to Cloudinary
                var originalUrl = await _cloudinaryService.UploadDesignPreviewAsync(imageStream, fileName);
                _logger.LogInformation("Original image uploaded: {Url}", originalUrl);

                // Step 2: Generate cartoon version
                // TODO: Integrate with actual Gemini API
                // For now, using mock implementation
                var cartoonUrl = await GenerateCartoonVersionAsync(originalUrl);
                _logger.LogInformation("Cartoon version generated: {Url}", cartoonUrl);

                // Step 3: Generate cutout version (background removal)
                var cutoutUrl = await GenerateCutoutVersionAsync(originalUrl);
                _logger.LogInformation("Cutout version generated: {Url}", cutoutUrl);

                return new GeminiPreviewResult
                {
                    OriginalImageUrl = originalUrl,
                    CartoonImageUrl = cartoonUrl,
                    CutoutImageUrl = cutoutUrl,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Gemini preview for {FileName}", fileName);
                return new GeminiPreviewResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<string> GenerateCartoonVersionAsync(string imageUrl)
        {
            try
            {
                _logger.LogInformation("Analyzing image with Gemini Vision API: {ImageUrl}", imageUrl);

                // Use Gemini Vision API to analyze the design
                var analysisPrompt = @"Analyze this product design image. Describe the main elements, colors, and shapes in detail. 
                                      Provide a detailed description that could be used to recreate this design in a cartoon/animated style.
                                      Focus on: background color, main graphic elements, text if any, layout composition.
                                      Format: JSON with fields: backgroundColor, mainElements[], colors[], style.";

                var imageBytes = await DownloadImageBytesAsync(imageUrl);
                var base64Image = Convert.ToBase64String(imageBytes);

                var analysisResult = await CallGeminiVisionApiAsync(base64Image, analysisPrompt);
                _logger.LogInformation("Gemini analysis complete: {Result}", analysisResult);

                // For now, apply Cloudinary transformations to create cartoon effect
                // In a full implementation, you would use the Gemini analysis to generate
                // prompts for image-to-image models like DALL-E 3 or Stable Diffusion
                var cartoonUrl = ApplyCartoonTransformation(imageUrl);
                
                _logger.LogInformation("Cartoon transformation applied: {Url}", cartoonUrl);
                return cartoonUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cartoon version, falling back to original");
                return imageUrl; // Fallback to original
            }
        }

        private async Task<string> GenerateCutoutVersionAsync(string imageUrl)
        {
            try
            {
                _logger.LogInformation("Generating cutout version with background removal: {ImageUrl}", imageUrl);

                // Apply Cloudinary's background removal
                // Cloudinary has built-in AI background removal with e_background_removal
                var cutoutUrl = ApplyCutoutTransformation(imageUrl);
                
                _logger.LogInformation("Cutout transformation applied: {Url}", cutoutUrl);
                return cutoutUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cutout version, falling back to original");
                return imageUrl; // Fallback to original
            }
        }

        private async Task<string> CallGeminiVisionApiAsync(string base64Image, string prompt)
        {
            try
            {
                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt },
                                new
                                {
                                    inline_data = new
                                    {
                                        mime_type = "image/jpeg",
                                        data = base64Image
                                    }
                                }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.4,
                        topK = 32,
                        topP = 1,
                        maxOutputTokens = 4096
                    }
                };

                var apiUrl = $"{_geminiBaseUrl}/models/{_geminiModel}:generateContent?key={_geminiApiKey}";
                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogDebug("Calling Gemini API: {Url}", apiUrl);
                var response = await _httpClient.PostAsync(apiUrl, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Gemini API error: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    throw new HttpRequestException($"Gemini API error: {response.StatusCode}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("Gemini API response: {Response}", responseJson);

                // Parse response to extract text content
                using var doc = JsonDocument.Parse(responseJson);
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];
                    var contentElement = firstCandidate.GetProperty("content");
                    var parts = contentElement.GetProperty("parts");
                    if (parts.GetArrayLength() > 0)
                    {
                        var text = parts[0].GetProperty("text").GetString();
                        return text ?? "No analysis generated";
                    }
                }

                return "No analysis generated";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini Vision API");
                throw;
            }
        }

        private async Task<byte[]> DownloadImageBytesAsync(string imageUrl)
        {
            try
            {
                var response = await _httpClient.GetAsync(imageUrl);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading image from {Url}", imageUrl);
                throw;
            }
        }

        private string ApplyCartoonTransformation(string cloudinaryUrl)
        {
            // Cloudinary transformations for cartoon effect:
            // - e_cartoonify: Apply cartoon effect
            // - e_outline: Add outline effect
            // - e_improve: Enhance quality
            // Example: https://res.cloudinary.com/demo/image/upload/e_cartoonify:50/sample.jpg
            
            if (cloudinaryUrl.Contains("/upload/"))
            {
                // Insert transformations after /upload/
                var transformations = "e_cartoonify:70,e_outline:15,q_auto";
                var modifiedUrl = cloudinaryUrl.Replace("/upload/", $"/upload/{transformations}/");
                return modifiedUrl;
            }

            return cloudinaryUrl; // Return original if URL format unexpected
        }

        private string ApplyCutoutTransformation(string cloudinaryUrl)
        {
            // Cloudinary AI-powered background removal
            // e_background_removal or e_bgremoval (new syntax)
            
            if (cloudinaryUrl.Contains("/upload/"))
            {
                var transformations = "e_background_removal,q_auto";
                var modifiedUrl = cloudinaryUrl.Replace("/upload/", $"/upload/{transformations}/");
                return modifiedUrl;
            }

            return cloudinaryUrl; // Return original if URL format unexpected
        }
    }

    // Extension method to convert Stream to Base64 (if needed for API calls)
    public static class StreamExtensions
    {
        public static async Task<string> ToBase64Async(this Stream stream)
        {
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();
            return Convert.ToBase64String(bytes);
        }
    }
}
