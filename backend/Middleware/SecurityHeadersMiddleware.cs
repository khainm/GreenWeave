namespace backend.Middleware
{
    /// <summary>
    /// Middleware to add security headers to all HTTP responses
    /// Protects against: XSS, Clickjacking, MIME sniffing, etc.
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWebHostEnvironment _env;

        public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment env)
        {
            _next = next;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Prevent MIME type sniffing
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";

            // Prevent clickjacking attacks
            context.Response.Headers["X-Frame-Options"] = "DENY";

            // Enable XSS protection in older browsers
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

            // Control referrer information
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Disable dangerous browser features
            context.Response.Headers["Permissions-Policy"] = 
                "geolocation=(), microphone=(), camera=(), payment=(), usb=()";

            // Content Security Policy
            var cspPolicy = _env.IsDevelopment() 
                ? BuildDevelopmentCSP() 
                : BuildProductionCSP();
            context.Response.Headers["Content-Security-Policy"] = cspPolicy;

            // HTTP Strict Transport Security (HSTS) - only in production
            if (!_env.IsDevelopment())
            {
                context.Response.Headers["Strict-Transport-Security"] = 
                    "max-age=31536000; includeSubDomains; preload";
            }

            // Remove server header to hide ASP.NET version
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");
            context.Response.Headers.Remove("X-AspNet-Version");
            context.Response.Headers.Remove("X-AspNetMvc-Version");

            await _next(context);
        }

        private string BuildDevelopmentCSP()
        {
            return "default-src 'self'; " +
                   "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                   "style-src 'self' 'unsafe-inline'; " +
                   "img-src 'self' data: https: blob:; " +
                   "font-src 'self' data:; " +
                   "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*; " +
                   "frame-ancestors 'none'; " +
                   "base-uri 'self'; " +
                   "form-action 'self';";
        }

        private string BuildProductionCSP()
        {
            return "default-src 'self'; " +
                   "script-src 'self'; " +
                   "style-src 'self' 'unsafe-inline'; " +
                   "img-src 'self' data: https://res.cloudinary.com https://*.cloudinary.com; " +
                   "font-src 'self' data:; " +
                   "connect-src 'self' https://api.greenweave.vn wss://api.greenweave.vn; " +
                   "frame-ancestors 'none'; " +
                   "base-uri 'self'; " +
                   "form-action 'self'; " +
                   "upgrade-insecure-requests;";
        }
    }
}
