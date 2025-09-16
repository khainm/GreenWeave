using backend.Extensions;
using backend.Interfaces.Services;
using System.Security.Claims;

namespace backend.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ClaimsPrincipal? _user;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _user = _httpContextAccessor.HttpContext?.User;
        }

        public string? UserId => _user?.GetUserId();

        public string? Email => _user?.GetEmail();

        public string? FullName => _user?.GetFullName();

        public string? CustomerCode => _user?.GetCustomerCode();

        public List<string> Roles => _user?.GetRoles() ?? new List<string>();

        public bool IsAuthenticated => _user?.Identity?.IsAuthenticated ?? false;

        public bool IsAdmin => _user?.IsAdmin() ?? false;

        public bool IsStaff => _user?.IsStaff() ?? false;

        public bool IsCustomer => _user?.IsCustomer() ?? false;

        public bool IsAdminOrStaff => _user?.IsAdminOrStaff() ?? false;

        public bool HasRole(string role)
        {
            return _user?.HasRole(role) ?? false;
        }

        public bool HasAnyRole(params string[] roles)
        {
            return _user?.HasAnyRole(roles) ?? false;
        }
    }
}
