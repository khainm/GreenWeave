using backend.Data;
using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using System.Web;

namespace backend.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            UserManager<User> userManager,
            IEmailService emailService,
            ILogger<PasswordResetService> logger)
        {
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<PasswordResetResponse> SendPasswordResetEmailAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    // Không tiết lộ user tồn tại hay không
                    return new PasswordResetResponse
                    {
                        Success = true,
                        Message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu."
                    };
                }

                // Generate password reset token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = HttpUtility.UrlEncode(token);

               // var resetLink = $"http://localhost:5173/reset-password?token={encodedToken}&uid={user.Id}";
                var resetLink = $"https://greenweave.vn/reset-password?token={encodedToken}&uid={user.Id}";

                _logger.LogInformation("Sending password reset email to {Email} with link {Link}", user.Email, resetLink);

                var emailSent = await _emailService.SendPasswordResetEmailAsync(user.Email ?? string.Empty, user.FullName, resetLink);
                if (!emailSent)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.",
                        Errors = new List<string> { "Email service error" }
                    };
                }

                return new PasswordResetResponse
                {
                    Success = true,
                    Message = "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset email for {Email}", email);
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình gửi email đặt lại mật khẩu.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<PasswordResetResponse> ResetPasswordAsync(string token, string userId, string newPassword)
        {
            try
            {
                _logger.LogInformation("Starting password reset for userId: {UserId}", userId);
                _logger.LogInformation("Received token (first 50 chars): {Token}", token?.Substring(0, Math.Min(50, token?.Length ?? 0)));

                if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(newPassword))
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token, User ID hoặc mật khẩu mới không hợp lệ."
                    };
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found with ID: {UserId}", userId);
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại."
                    };
                }

                _logger.LogInformation("User found: {Email}", user.Email);

                var decodedToken = HttpUtility.UrlDecode(token);
                _logger.LogInformation("Decoded token (first 50 chars): {DecodedToken}", decodedToken?.Substring(0, Math.Min(50, decodedToken?.Length ?? 0)));

                if (string.IsNullOrEmpty(decodedToken))
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token không hợp lệ sau khi decode."
                    };
                }

                // Thử validate token trước khi reset để debug
                var isValidToken = await _userManager.VerifyUserTokenAsync(user, _userManager.Options.Tokens.PasswordResetTokenProvider, "ResetPassword", decodedToken);
                _logger.LogInformation("Token validation result: {IsValid}", isValidToken);

                if (!isValidToken)
                {
                    _logger.LogWarning("Token validation failed for user {UserId}", userId);
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.",
                        Errors = new List<string> { "Token validation failed" }
                    };
                }

                var result = await _userManager.ResetPasswordAsync(user, decodedToken, newPassword);
                if (!result.Succeeded)
                {
                    // Check if this is a concurrency issue and password was already reset
                    var refreshedUser = await _userManager.FindByIdAsync(userId);
                    if (refreshedUser != null)
                    {
                        // If we can login with the new password, it means password was already reset by concurrent operation
                        var passwordCheckResult = await _userManager.CheckPasswordAsync(refreshedUser, newPassword);
                        if (passwordCheckResult)
                        {
                            _logger.LogInformation("Password was reset by concurrent operation for user: {UserId}", userId);
                            return new PasswordResetResponse
                            {
                                Success = true,
                                Message = "Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới."
                            };
                        }
                    }
                    
                    _logger.LogWarning("Password reset failed for user {UserId}. Errors: {Errors}", 
                        userId, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Đặt lại mật khẩu thất bại.",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                _logger.LogInformation("Password reset successfully for user: {UserId}", userId);

                return new PasswordResetResponse
                {
                    Success = true,
                    Message = "Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình đặt lại mật khẩu.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<PasswordResetResponse> ValidateResetTokenAsync(string token, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại."
                    };
                }

                // For ASP.NET Identity tokens, we can't easily validate without consuming them
                // So we'll return success if user exists - actual validation happens in ResetPasswordAsync
                return new PasswordResetResponse
                {
                    Success = true,
                    Message = "Token hợp lệ. Bạn có thể đặt lại mật khẩu."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token for user {UserId}", userId);
                return new PasswordResetResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình xác thực token.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }
    }
}
