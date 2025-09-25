using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IPasswordResetService
    {
        Task<PasswordResetResponse> SendPasswordResetEmailAsync(string email);
        Task<PasswordResetResponse> ResetPasswordAsync(string token, string userId, string newPassword);
        Task<PasswordResetResponse> ValidateResetTokenAsync(string token, string userId);
    }
}
