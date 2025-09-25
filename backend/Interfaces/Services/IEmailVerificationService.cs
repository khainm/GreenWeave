using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IEmailVerificationService
    {
        Task<EmailVerificationResponse> SendVerificationEmailAsync(string email);
        Task<EmailVerificationResponse> VerifyEmailAsync(string token, string userId);
        Task<EmailVerificationResponse> ResendVerificationEmailAsync(string email);
        Task<bool> IsTokenValidAsync(string token, string userId);
        Task CleanupExpiredTokensAsync();
    }
}
