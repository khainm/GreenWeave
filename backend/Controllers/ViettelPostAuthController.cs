using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;
using backend.Attributes;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ViettelPostAuthController : ControllerBase
    {
        private readonly IViettelPostAuthService _authService;
        private readonly ILogger<ViettelPostAuthController> _logger;

        public ViettelPostAuthController(
            IViettelPostAuthService authService,
            ILogger<ViettelPostAuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Kiểm tra trạng thái token hiện tại
        /// </summary>
        [HttpGet("status")]
        [RequireRole("Admin")]
        public async Task<IActionResult> GetTokenStatus()
        {
            try
            {
                var isValid = _authService.IsTokenValid();
                var token = isValid ? await _authService.GetValidTokenAsync() : "Token invalid";

                return Ok(new
                {
                    success = true,
                    isValid = isValid,
                    tokenPreview = isValid ? $"{token[..20]}..." : "No valid token",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking ViettelPost token status");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Refresh token thủ công
        /// </summary>
        [HttpPost("refresh")]
        [RequireRole("Admin")]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                await _authService.RefreshTokenAsync();
                var newToken = await _authService.GetValidTokenAsync();

                return Ok(new
                {
                    success = true,
                    message = "Token refreshed successfully",
                    tokenPreview = $"{newToken[..20]}...",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing ViettelPost token");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Test API với token hiện tại
        /// </summary>
        [HttpGet("test")]
        [RequireRole("Admin")]
        public async Task<IActionResult> TestToken()
        {
            try
            {
                var token = await _authService.GetValidTokenAsync();

                // Test simple API call (Get provinces)
                using var httpClient = new HttpClient();
                httpClient.BaseAddress = new Uri("https://partner.viettelpost.vn/v2");
                httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await httpClient.GetAsync("/categories/listProvince");
                var content = await response.Content.ReadAsStringAsync();

                return Ok(new
                {
                    success = response.IsSuccessStatusCode,
                    statusCode = (int)response.StatusCode,
                    tokenValid = response.IsSuccessStatusCode,
                    responsePreview = content.Length > 200 ? $"{content[..200]}..." : content,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing ViettelPost token");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}