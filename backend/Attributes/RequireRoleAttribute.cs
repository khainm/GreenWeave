using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace backend.Attributes
{
    public class RequireRoleAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _roles;

        public RequireRoleAttribute(params string[] roles)
        {
            _roles = roles;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Check if user is authenticated
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Bạn cần đăng nhập để truy cập tài nguyên này",
                    statusCode = 401
                });
                return;
            }

            // Check if user has required roles
            var userRoles = context.HttpContext.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            
            if (_roles.Length > 0 && !_roles.Any(role => userRoles.Contains(role)))
            {
                context.Result = new ForbidResult();
                context.HttpContext.Response.StatusCode = 403;
                
                // You could also return a custom JSON response
                context.Result = new ObjectResult(new
                {
                    success = false,
                    message = $"Bạn cần có quyền {string.Join(" hoặc ", _roles)} để truy cập tài nguyên này",
                    statusCode = 403,
                    requiredRoles = _roles,
                    userRoles = userRoles
                })
                {
                    StatusCode = 403
                };
            }
        }
    }
}
