using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using backend.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class EmailVerificationService : IEmailVerificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailVerificationService> _logger;

        public EmailVerificationService(
            ApplicationDbContext context,
            UserManager<User> userManager,
            IEmailService emailService,
            ILogger<EmailVerificationService> logger)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<EmailVerificationResponse> SendVerificationEmailAsync(string email)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Email không tồn tại trong hệ thống",
                        Errors = new List<string> { "Không tìm thấy tài khoản với email này" }
                    };
                }

                if (user.EmailConfirmed)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Email đã được xác thực",
                        Errors = new List<string> { "Tài khoản đã được xác thực trước đó" }
                    };
                }

                // Kiểm tra rate limit (5 lần/giờ)
                var recentTokens = await _context.EmailVerificationTokens
                    .Where(t => t.UserId == user.Id && t.CreatedAt > DateTime.UtcNow.AddHours(-1))
                    .CountAsync();

                if (recentTokens >= 5)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Đã gửi quá nhiều email xác thực",
                        Errors = new List<string> { "Vui lòng đợi 1 giờ trước khi gửi lại email xác thực" }
                    };
                }

                // Tạo token mới
                var token = Guid.NewGuid().ToString("N");
                var verificationToken = new EmailVerificationToken
                {
                    UserId = user.Id,
                    Token = token,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(48), // 48 giờ
                    IsUsed = false
                };

                _context.EmailVerificationTokens.Add(verificationToken);
                await _context.SaveChangesAsync();

                // Gửi email
                
               // Create verification link
            var verificationLink = $"https://greenweave.vn/verify-email?token={token}&uid={user.Id}";
            
            // Send verification email

                _logger.LogInformation("Sending verification email to {Email} with link {Link}", user.Email, verificationLink);
                var emailSent = await _emailService.SendEmailConfirmationAsync(user.Email ?? string.Empty, user.FullName, verificationLink);

                if (!emailSent)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Không thể gửi email xác thực",
                        Errors = new List<string> { "Vui lòng thử lại sau" }
                    };
                }

                return new EmailVerificationResponse
                {
                    Success = true,
                    Message = "Email xác thực đã được gửi thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending verification email for {Email}", email);
                return new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi gửi email xác thực",
                    Errors = new List<string> { "Vui lòng thử lại sau" }
                };
            }
        }

        public async Task<EmailVerificationResponse> VerifyEmailAsync(string token, string userId)
        {
            try
            {
                var verificationToken = await _context.EmailVerificationTokens
                    .FirstOrDefaultAsync(t => t.Token == token && t.UserId == userId);

                if (verificationToken == null)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        Errors = new List<string> { "Token không tồn tại hoặc đã được sử dụng" }
                    };
                }

                if (verificationToken.IsUsed)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Token đã được sử dụng",
                        Errors = new List<string> { "Token này đã được sử dụng trước đó" }
                    };
                }

                if (verificationToken.ExpiresAt < DateTime.UtcNow)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Token đã hết hạn",
                        Errors = new List<string> { "Liên kết xác thực đã hết hạn, vui lòng gửi lại email xác thực" }
                    };
                }

                // Xác thực email
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại",
                        Errors = new List<string> { "Không tìm thấy tài khoản" }
                    };
                }

                var result = await _userManager.ConfirmEmailAsync(user, token);
                if (!result.Succeeded)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Xác thực email thất bại",
                        Errors = new List<string> { "Không thể xác thực email, vui lòng thử lại" }
                    };
                }

                // Đánh dấu token đã sử dụng
                verificationToken.IsUsed = true;
                verificationToken.UsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return new EmailVerificationResponse
                {
                    Success = true,
                    Message = "Email đã được xác thực thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email with token {Token}", token);
                return new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi xác thực email",
                    Errors = new List<string> { "Vui lòng thử lại sau" }
                };
            }
        }

        public async Task<EmailVerificationResponse> ResendVerificationEmailAsync(string email)
        {
            return await SendVerificationEmailAsync(email);
        }

        public async Task<bool> IsTokenValidAsync(string token, string userId)
        {
            var verificationToken = await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(t => t.Token == token && t.UserId == userId);

            return verificationToken != null && 
                   !verificationToken.IsUsed && 
                   verificationToken.ExpiresAt > DateTime.UtcNow;
        }

        public async Task CleanupExpiredTokensAsync()
        {
            var expiredTokens = await _context.EmailVerificationTokens
                .Where(t => t.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            _context.EmailVerificationTokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} expired verification tokens", expiredTokens.Count);
        }
    }
}
