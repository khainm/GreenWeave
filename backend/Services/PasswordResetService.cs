using backend.Data;
using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            UserManager<User> userManager,
            IEmailService emailService,
            ApplicationDbContext context,
            ILogger<PasswordResetService> logger)
        {
            _userManager = userManager;
            _emailService = emailService;
            _context = context;
            _logger = logger;
        }

        public async Task<PasswordResetResponse> SendPasswordResetEmailAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    // Không tiết lộ thông tin user không tồn tại
                    return new PasswordResetResponse
                    {
                        Success = true,
                        Message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu."
                    };
                }

                // Check rate limit for password reset (e.g., 3 times per hour)
                var recentTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && t.CreatedAt > DateTime.UtcNow.AddHours(-1))
                    .CountAsync();

                if (recentTokens >= 3)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.",
                        Errors = new List<string> { "Rate limit exceeded" }
                    };
                }

                // Invalidate previous tokens for this user
                var existingTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiryDate > DateTime.UtcNow)
                    .ToListAsync();

                foreach (var token in existingTokens)
                {
                    token.UsedAt = DateTime.UtcNow; // Mark as used/invalidated
                }
                await _context.SaveChangesAsync();

                // Generate new token
                var resetToken = Guid.NewGuid().ToString();
                var passwordResetToken = new PasswordResetToken
                {
                    UserId = user.Id,
                    Token = resetToken,
                    ExpiryDate = DateTime.UtcNow.AddHours(1) // Token expires in 1 hour
                };

                _context.PasswordResetTokens.Add(passwordResetToken);
                await _context.SaveChangesAsync();

                // Send email
                var resetLink = $"http://localhost:5173/reset-password?token={resetToken}&uid={user.Id}";
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
                var resetToken = await _context.PasswordResetTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == token && t.UserId == userId);

                if (resetToken == null)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu không hợp lệ.",
                        Errors = new List<string> { "Invalid token" }
                    };
                }

                if (resetToken.IsUsed)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu đã được sử dụng.",
                        Errors = new List<string> { "Token already used" }
                    };
                }

                if (resetToken.IsExpired)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại.",
                        Errors = new List<string> { "Token expired" }
                    };
                }

                var user = resetToken.User;
                if (user == null)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại.",
                        Errors = new List<string> { "User not found" }
                    };
                }

                // Reset password
                var removePasswordResult = await _userManager.RemovePasswordAsync(user);
                if (!removePasswordResult.Succeeded)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
                        Errors = removePasswordResult.Errors.Select(e => e.Description).ToList()
                    };
                }

                var addPasswordResult = await _userManager.AddPasswordAsync(user, newPassword);
                if (!addPasswordResult.Succeeded)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
                        Errors = addPasswordResult.Errors.Select(e => e.Description).ToList()
                    };
                }

                // Mark token as used
                resetToken.UsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

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
                var resetToken = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.Token == token && t.UserId == userId);

                if (resetToken == null)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu không hợp lệ.",
                        Errors = new List<string> { "Invalid token" }
                    };
                }

                if (resetToken.IsUsed)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu đã được sử dụng.",
                        Errors = new List<string> { "Token already used" }
                    };
                }

                if (resetToken.IsExpired)
                {
                    return new PasswordResetResponse
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại.",
                        Errors = new List<string> { "Token expired" }
                    };
                }

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
