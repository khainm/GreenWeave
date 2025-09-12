using System.Security.Claims;

namespace backend.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string? GetUserId(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        public static string? GetEmail(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.Email);
        }

        public static string? GetFullName(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue(ClaimTypes.Name);
        }

        public static string? GetCustomerCode(this ClaimsPrincipal principal)
        {
            return principal.FindFirstValue("CustomerCode");
        }

        public static List<string> GetRoles(this ClaimsPrincipal principal)
        {
            return principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        }

        public static bool HasRole(this ClaimsPrincipal principal, string role)
        {
            return principal.IsInRole(role);
        }

        public static bool HasAnyRole(this ClaimsPrincipal principal, params string[] roles)
        {
            return roles.Any(role => principal.IsInRole(role));
        }

        public static bool IsAdmin(this ClaimsPrincipal principal)
        {
            return principal.IsInRole("Admin");
        }

        public static bool IsStaff(this ClaimsPrincipal principal)
        {
            return principal.IsInRole("Staff");
        }

        public static bool IsCustomer(this ClaimsPrincipal principal)
        {
            return principal.IsInRole("Customer");
        }

        public static bool IsAdminOrStaff(this ClaimsPrincipal principal)
        {
            return principal.IsInRole("Admin") || principal.IsInRole("Staff");
        }
    }
}
