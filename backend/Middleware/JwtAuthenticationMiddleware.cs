using System.Net;
using System.Text.Json;

namespace backend.Middleware
{
    public class JwtAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtAuthenticationMiddleware> _logger;

        public JwtAuthenticationMiddleware(RequestDelegate next, ILogger<JwtAuthenticationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (UnauthorizedAccessException)
            {
                _logger.LogWarning("Unauthorized access attempt from {IP}", context.Connection.RemoteIpAddress);
                await HandleUnauthorizedAsync(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred in JWT authentication middleware");
                throw;
            }

            // Handle 401 responses
            if (context.Response.StatusCode == 401)
            {
                await HandleUnauthorizedAsync(context);
            }
        }

        private static async Task HandleUnauthorizedAsync(HttpContext context)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.ContentType = "application/json";

            var response = new
            {
                success = false,
                message = "Token không hợp lệ hoặc đã hết hạn",
                statusCode = 401,
                timestamp = DateTime.UtcNow
            };

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }
}
