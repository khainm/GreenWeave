using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user, IList<string>? roles = null);
        string? GetUserIdFromToken(string token);
        bool ValidateToken(string token);
    }
}
