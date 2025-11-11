// 📤 Upload Controller
// Handles file uploads to Cloudinary

using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<UploadController> _logger;

        public UploadController(
            ICloudinaryService cloudinaryService,
            ILogger<UploadController> logger)
        {
            _cloudinaryService = cloudinaryService;
            _logger = logger;
        }

        /// <summary>
        /// Upload image to Cloudinary
        /// POST /api/upload
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string? type, [FromForm] string? category)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No file provided"
                    });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid file type. Only JPEG, PNG, GIF, WEBP allowed"
                    });
                }

                // Validate file size (max 10MB)
                const long maxSize = 10 * 1024 * 1024;
                if (file.Length > maxSize)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "File size exceeds 10MB limit"
                    });
                }

                _logger.LogInformation("📤 [Upload] Uploading file: {FileName}, Size: {Size} bytes, Type: {Type}, Category: {Category}",
                    file.FileName, file.Length, type, category);

                // Upload to Cloudinary
                string imageUrl;
                using (var stream = file.OpenReadStream())
                {
                    // Use appropriate upload method based on category/type
                    if (category == "custom-design" || type == "design")
                    {
                        imageUrl = await _cloudinaryService.UploadDesignPreviewAsync(stream, file.FileName);
                    }
                    else
                    {
                        imageUrl = await _cloudinaryService.UploadUserImageAsync(stream, file.FileName);
                    }
                }

                _logger.LogInformation("✅ [Upload] File uploaded successfully: {Url}", imageUrl);

                return Ok(new
                {
                    success = true,
                    url = imageUrl,
                    message = "File uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [Upload] Error uploading file");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to upload file",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Upload base64 image to Cloudinary
        /// POST /api/upload/base64
        /// </summary>
        [HttpPost("base64")]
        public async Task<IActionResult> UploadBase64([FromBody] Base64UploadRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Base64Data))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "No base64 data provided"
                    });
                }

                _logger.LogInformation("📤 [Upload] Uploading base64 image, Size: {Size} chars", request.Base64Data.Length);

                // Remove data URI prefix if present (e.g., "data:image/png;base64,")
                var base64String = request.Base64Data;
                if (base64String.Contains(","))
                {
                    base64String = base64String.Split(',')[1];
                }

                // Convert base64 to byte array
                byte[] imageBytes = Convert.FromBase64String(base64String);

                // Upload to Cloudinary
                string imageUrl;
                using (var stream = new MemoryStream(imageBytes))
                {
                    var fileName = $"{request.FileName ?? "upload"}_{DateTime.UtcNow:yyyyMMddHHmmss}.png";
                    
                    if (request.Category == "custom-design" || request.Type == "design")
                    {
                        imageUrl = await _cloudinaryService.UploadDesignPreviewAsync(stream, fileName);
                    }
                    else
                    {
                        imageUrl = await _cloudinaryService.UploadUserImageAsync(stream, fileName);
                    }
                }

                _logger.LogInformation("✅ [Upload] Base64 uploaded successfully: {Url}", imageUrl);

                return Ok(new
                {
                    success = true,
                    url = imageUrl,
                    message = "Base64 image uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [Upload] Error uploading base64 image");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to upload base64 image",
                    error = ex.Message
                });
            }
        }
    }

    public class Base64UploadRequest
    {
        public string Base64Data { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public string? Type { get; set; }
        public string? Category { get; set; }
    }
}
