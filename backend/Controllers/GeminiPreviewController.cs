using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using System.Threading.Tasks;
using System.IO;
using System;
using System.Linq;

namespace backend.Controllers
{
    public class GeminiPreviewRequest
    {
        public IFormFile Image { get; set; } = null!;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class GeminiPreviewController : ControllerBase
    {
        private readonly IGeminiPreviewService _geminiService;
        private readonly ILogger<GeminiPreviewController> _logger;

        public GeminiPreviewController(
            IGeminiPreviewService geminiService,
            ILogger<GeminiPreviewController> logger)
        {
            _geminiService = geminiService;
            _logger = logger;
        }

        /// <summary>
        /// Generate cartoon and cutout preview versions of the design
        /// POST /api/geminipreview/generate
        /// </summary>
        [HttpPost("generate")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GeneratePreview([FromForm] GeminiPreviewRequest request)
        {
            var image = request.Image;
            
            if (image == null || image.Length == 0)
            {
                return BadRequest(new { 
                    success = false, 
                    message = "No image file provided" 
                });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
            {
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid file type. Only JPEG and PNG are allowed." 
                });
            }

            // Validate file size (max 10MB)
            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { 
                    success = false, 
                    message = "File size exceeds 10MB limit" 
                });
            }

            try
            {
                using var stream = image.OpenReadStream();
                var result = await _geminiService.GeneratePreviewAsync(stream, image.FileName);

                if (!result.Success)
                {
                    return StatusCode(500, new { 
                        success = false, 
                        message = result.ErrorMessage ?? "Failed to generate preview" 
                    });
                }

                return Ok(new { 
                    success = true, 
                    data = new 
                    {
                        originalUrl = result.OriginalImageUrl,
                        cartoonUrl = result.CartoonImageUrl,
                        cutoutUrl = result.CutoutImageUrl
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating preview");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to generate preview. Please try again." 
                });
            }
        }

        /// <summary>
        /// Health check endpoint
        /// GET /api/geminipreview/health
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { 
                success = true, 
                message = "Gemini Preview Service is running",
                timestamp = DateTime.UtcNow
            });
        }
    }
}
