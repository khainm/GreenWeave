using AspNetCoreRateLimit;

namespace backend.Configuration
{
    /// <summary>
    /// Configuration for IP-based rate limiting
    /// Protects against brute force attacks and DDoS
    /// </summary>
    public static class RateLimitConfiguration
    {
        public static void ConfigureRateLimiting(this IServiceCollection services, IConfiguration configuration)
        {
            // Store rate limit counters and rules in memory cache
            services.AddMemoryCache();

            // Load configuration from appsettings
            services.Configure<IpRateLimitOptions>(configuration.GetSection("IpRateLimiting"));
            services.Configure<IpRateLimitPolicies>(configuration.GetSection("IpRateLimitPolicies"));

            // Inject counter and rules stores
            services.AddInMemoryRateLimiting();

            // Configuration for ClientRateLimiting
            services.AddSingleton<IRateLimitConfiguration, AspNetCoreRateLimit.RateLimitConfiguration>();
        }

        /// <summary>
        /// Default rate limit options if not specified in appsettings
        /// </summary>
        public static void ConfigureDefaultRateLimitOptions(IpRateLimitOptions options)
        {
            options.EnableEndpointRateLimiting = true;
            options.StackBlockedRequests = false;
            options.HttpStatusCode = 429; // Too Many Requests
            options.RealIpHeader = "X-Real-IP";
            options.ClientIdHeader = "X-ClientId";

            // General rules - apply to all endpoints unless overridden
            options.GeneralRules = new List<RateLimitRule>
            {
                // Login endpoint - strict rate limiting to prevent brute force
                new RateLimitRule
                {
                    Endpoint = "POST:/api/auth/login",
                    Period = "1m",
                    Limit = 5 // Max 5 login attempts per minute
                },
                new RateLimitRule
                {
                    Endpoint = "POST:/api/auth/login",
                    Period = "15m",
                    Limit = 10 // Max 10 login attempts per 15 minutes
                },

                // Register endpoint - prevent spam registrations
                new RateLimitRule
                {
                    Endpoint = "POST:/api/auth/register",
                    Period = "1h",
                    Limit = 3 // Max 3 registrations per hour per IP
                },

                // Password reset - prevent abuse
                new RateLimitRule
                {
                    Endpoint = "POST:/api/passwordreset/*",
                    Period = "15m",
                    Limit = 3 // Max 3 password reset requests per 15 minutes
                },

                // Email verification - prevent spam
                new RateLimitRule
                {
                    Endpoint = "POST:/api/emailverification/resend",
                    Period = "5m",
                    Limit = 2 // Max 2 resend requests per 5 minutes
                },

                // Webhooks - allow higher rate for legitimate webhook calls
                new RateLimitRule
                {
                    Endpoint = "POST:/api/webhook/*",
                    Period = "1m",
                    Limit = 30
                },

                // API general rate limit - prevent API abuse
                new RateLimitRule
                {
                    Endpoint = "*/api/*",
                    Period = "1m",
                    Limit = 100 // Max 100 requests per minute per IP
                },
                new RateLimitRule
                {
                    Endpoint = "*/api/*",
                    Period = "1h",
                    Limit = 1000 // Max 1000 requests per hour per IP
                }
            };

            // Whitelist localhost and health check endpoints
            options.EndpointWhitelist = new List<string>
            {
                "GET:/health",
                "GET:/",
                "GET:/api/webhook/viettelpost/health",
                "GET:/api/webhook/viettelpost/docs"
            };

            // Whitelist trusted IP addresses (if needed)
            // options.IpWhitelist = new List<string> { "127.0.0.1", "::1" };
        }
    }
}
