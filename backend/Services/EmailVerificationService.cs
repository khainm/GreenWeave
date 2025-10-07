using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using System.Web;

namespace backend.Services
{
    public class EmailVerificationService : IEmailVerificationService
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailVerificationService> _logger;

        public EmailVerificationService(
            UserManager<User> userManager,
            IEmailService emailService,
            ILogger<EmailVerificationService> logger)
        {
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
                    // Không tiết lộ thông tin user không tồn tại
                    return new EmailVerificationResponse
                    {
                        Success = true,
                        Message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email xác thực."
                    };
                }

                if (user.EmailConfirmed)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Email đã được xác thực."
                    };
                }

                // Tạo Identity email confirmation token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

                // Encode token để đưa vào URL
                var encodedToken = HttpUtility.UrlEncode(token);

                // Create verification link
                //var verificationLink = $"http://localhost:5173/verify-email?token={encodedToken}&uid={user.Id}";
                 var verificationLink = $"https://greenweave.vn/verify-email?token={encodedToken}&uid={user.Id}";

                _logger.LogInformation("Sending verification email to {Email} with link {Link}", user.Email, verificationLink);

                var emailSent = await _emailService.SendEmailConfirmationAsync(user.Email ?? string.Empty, user.FullName, verificationLink);

                if (!emailSent)
                {
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Không thể gửi email xác thực. Vui lòng thử lại sau."
                    };
                }

                return new EmailVerificationResponse
                {
                    Success = true,
                    Message = "Email xác thực đã được gửi thành công. Vui lòng kiểm tra hộp thư của bạn."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending verification email for {Email}", email);
                return new EmailVerificationResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình gửi email xác thực.",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<EmailVerificationResponse> VerifyEmailAsync(string token, string userId)
        {
            const int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    _logger.LogInformation("Starting email verification attempt {Attempt}/{MaxRetries} for userId: {UserId}", attempt, maxRetries, userId);
                    _logger.LogInformation("Received token (first 50 chars): {Token}", token?.Substring(0, Math.Min(50, token?.Length ?? 0)));

                    if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(userId))
                    {
                        return new EmailVerificationResponse
                        {
                            Success = false,
                            Message = "Token hoặc User ID không hợp lệ."
                        };
                    }

                    var user = await _userManager.FindByIdAsync(userId);
                    if (user == null)
                    {
                        _logger.LogWarning("User not found with ID: {UserId}", userId);
                        return new EmailVerificationResponse
                        {
                            Success = false,
                            Message = "Người dùng không tồn tại."
                        };
                    }

                    _logger.LogInformation("User found: {Email}, EmailConfirmed: {EmailConfirmed}", user.Email, user.EmailConfirmed);

                    if (user.EmailConfirmed)
                    {
                        _logger.LogInformation("Email already confirmed for user: {UserId}", userId);
                        return new EmailVerificationResponse
                        {
                            Success = true,
                            Message = "Email đã được xác thực trước đó."
                        };
                    }

                    // Decode token trước khi xác thực
                    var decodedToken = HttpUtility.UrlDecode(token);
                    _logger.LogInformation("Decoded token (first 50 chars): {DecodedToken}", decodedToken?.Substring(0, Math.Min(50, decodedToken?.Length ?? 0)));

                    if (string.IsNullOrEmpty(decodedToken))
                    {
                        return new EmailVerificationResponse
                        {
                            Success = false,
                            Message = "Token không hợp lệ sau khi decode."
                        };
                    }

                    var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
                    if (!result.Succeeded)
                    {
                        // Check if this is a concurrency issue and email is already confirmed
                        var refreshedUser = await _userManager.FindByIdAsync(userId);
                        if (refreshedUser?.EmailConfirmed == true)
                        {
                            _logger.LogInformation("Email was confirmed by concurrent operation for user: {UserId}", userId);
                            return new EmailVerificationResponse
                            {
                                Success = true,
                                Message = "Email đã được xác thực thành công."
                            };
                        }

                        _logger.LogWarning("Email confirmation failed for user {UserId} on attempt {Attempt}. Errors: {Errors}", 
                            userId, attempt, string.Join(", ", result.Errors.Select(e => e.Description)));
                        
                        // Check if it's a concurrency conflict that we should retry
                        var hasOptimisticConcurrencyError = result.Errors.Any(e => 
                            e.Description.Contains("concurrency", StringComparison.OrdinalIgnoreCase) ||
                            e.Description.Contains("conflict", StringComparison.OrdinalIgnoreCase));

                        if (hasOptimisticConcurrencyError && attempt < maxRetries)
                        {
                            _logger.LogInformation("Detected concurrency conflict, retrying attempt {NextAttempt} after delay...", attempt + 1);
                            await Task.Delay(100 * attempt); // Progressive delay: 100ms, 200ms, 300ms
                            continue; // Retry
                        }

                        return new EmailVerificationResponse
                        {
                            Success = false,
                            Message = "Xác thực email thất bại.",
                            Errors = result.Errors.Select(e => e.Description).ToList()
                        };
                    }

                    _logger.LogInformation("Email confirmed successfully for user: {UserId} on attempt {Attempt}", userId, attempt);
                    return new EmailVerificationResponse
                    {
                        Success = true,
                        Message = "Email đã được xác thực thành công."
                    };
                }
                catch (Exception ex) when (attempt < maxRetries && (
                    ex.Message.Contains("concurrency", StringComparison.OrdinalIgnoreCase) ||
                    ex.Message.Contains("conflict", StringComparison.OrdinalIgnoreCase)))
                {
                    _logger.LogWarning(ex, "Concurrency exception on attempt {Attempt} for user {UserId}, retrying...", attempt, userId);
                    await Task.Delay(100 * attempt); // Progressive delay
                    continue; // Retry
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error verifying email for user {UserId} on attempt {Attempt}", userId, attempt);
                    return new EmailVerificationResponse
                    {
                        Success = false,
                        Message = "Đã xảy ra lỗi trong quá trình xác thực email.",
                        Errors = new List<string> { ex.Message }
                    };
                }
            }

            // This should never be reached, but just in case
            return new EmailVerificationResponse
            {
                Success = false,
                Message = "Xác thực email thất bại sau nhiều lần thử."
            };
        }

        public async Task<EmailVerificationResponse> ResendVerificationEmailAsync(string email)
        {
            return await SendVerificationEmailAsync(email);
        }

        public async Task<bool> IsTokenValidAsync(string token, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return false;

                if (user.EmailConfirmed) return false; // Already confirmed

                // For ASP.NET Identity tokens, we can't easily validate without consuming them
                // So we'll return true if user exists and email is not confirmed
                // The actual validation will happen in VerifyEmailAsync
                return !string.IsNullOrEmpty(token) && !string.IsNullOrEmpty(userId);
            }
            catch
            {
                return false;
            }
        }

        public async Task CleanupExpiredTokensAsync()
        {
            // With ASP.NET Identity tokens, cleanup is handled automatically
            // Tokens have built-in expiration and don't need manual cleanup
            _logger.LogInformation("Token cleanup not needed for ASP.NET Identity tokens - handled automatically");
            await Task.CompletedTask;
        }
    }
}
