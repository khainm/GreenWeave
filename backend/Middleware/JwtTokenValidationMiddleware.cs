using backend.Interfaces.Services;
using System.Security.Claims;

namespace backend.Middleware
{
    public class JwtTokenValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtTokenValidationMiddleware> _logger;

        public JwtTokenValidationMiddleware(RequestDelegate next, ILogger<JwtTokenValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IJwtService jwtService)
        {
            var token = ExtractTokenFromHeader(context);

            if (!string.IsNullOrEmpty(token))
            {
                try
                {
                    if (jwtService.ValidateToken(token))
                    {
                        var userId = jwtService.GetUserIdFromToken(token);
                        
                        if (!string.IsNullOrEmpty(userId))
                        {
                            // Add user ID to context for easy access
                            context.Items["UserId"] = userId;
                            _logger.LogInformation("Token validated successfully for user: {UserId}", userId);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Invalid token provided from {IP}", context.Connection.RemoteIpAddress);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error validating JWT token");
                }
            }

            await _next(context);
        }

        private static string? ExtractTokenFromHeader(HttpContext context)
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            
            if (authHeader?.StartsWith("Bearer ") == true)
            {
                return authHeader.Substring("Bearer ".Length).Trim();
            }

            return null;
        }
    }
}
