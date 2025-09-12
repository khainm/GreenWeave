using backend.Extensions;
using System.Security.Claims;

namespace backend.Interfaces.Services
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        string? Email { get; }
        string? FullName { get; }
        string? CustomerCode { get; }
        List<string> Roles { get; }
        bool IsAuthenticated { get; }
        bool IsAdmin { get; }
        bool IsStaff { get; }
        bool IsCustomer { get; }
        bool IsAdminOrStaff { get; }
        bool HasRole(string role);
        bool HasAnyRole(params string[] roles);
    }
}
