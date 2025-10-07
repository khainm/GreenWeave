using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordResetController : ControllerBase
    {
        private readonly IPasswordResetService _passwordResetService;
        private readonly ILogger<PasswordResetController> _logger;

        public PasswordResetController(IPasswordResetService passwordResetService, ILogger<PasswordResetController> logger)
        {
            _passwordResetService = passwordResetService;
            _logger = logger;
        }

        /// <summary>
        /// Gửi email đặt lại mật khẩu
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<ActionResult<PasswordResetResponse>> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            _logger.LogInformation("Received request to send password reset email for: {Email}", dto.Email);
            var result = await _passwordResetService.SendPasswordResetEmailAsync(dto.Email);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to send password reset email for {Email}: {Message}", dto.Email, result.Message);
                return BadRequest(result);
            }
            _logger.LogInformation("Successfully initiated sending password reset email for: {Email}", dto.Email);
            return Ok(result);
        }

        /// <summary>
        /// Xác thực token đặt lại mật khẩu
        /// </summary>
        [HttpPost("validate-token")]
        public async Task<ActionResult<PasswordResetResponse>> ValidateToken([FromBody] ValidateTokenDto dto)
        {
            _logger.LogInformation("Received request to validate reset token for UserId: {UserId}", dto.UserId);
            var result = await _passwordResetService.ValidateResetTokenAsync(dto.Token, dto.UserId);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to validate reset token for UserId: {UserId}. Message: {Message}", dto.UserId, result.Message);
                return BadRequest(result);
            }
            _logger.LogInformation("Successfully validated reset token for UserId: {UserId}", dto.UserId);
            return Ok(result);
        }

        /// <summary>
        /// Đặt lại mật khẩu
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<ActionResult<PasswordResetResponse>> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            _logger.LogInformation("Received request to reset password for UserId: {UserId}", dto.UserId);
            _logger.LogInformation("Request data - Token: {Token}, NewPassword length: {PasswordLength}, ConfirmPassword length: {ConfirmPasswordLength}", 
                dto.Token?.Substring(0, Math.Min(30, dto.Token?.Length ?? 0)), 
                dto.NewPassword?.Length, 
                dto.ConfirmNewPassword?.Length);

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList();
                _logger.LogWarning("Model validation failed for reset password. Errors: {Errors}", string.Join(", ", errors));
                return BadRequest(new PasswordResetResponse
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    Errors = errors
                });
            }

            var result = await _passwordResetService.ResetPasswordAsync(dto.Token ?? string.Empty, dto.UserId ?? string.Empty, dto.NewPassword ?? string.Empty);
            if (!result.Success)
            {
                _logger.LogWarning("Failed to reset password for UserId: {UserId}. Message: {Message}", dto.UserId, result.Message);
                return BadRequest(result);
            }
            _logger.LogInformation("Successfully reset password for UserId: {UserId}", dto.UserId);
            return Ok(result);
        }
    }

    public class ValidateTokenDto
    {
        public string Token { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}
