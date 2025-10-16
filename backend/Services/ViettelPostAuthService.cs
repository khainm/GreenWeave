using System.Text.Json;
using System.Text;
using backend.Interfaces.Services;

namespace backend.Services
{
    public class ViettelPostAuthService : IViettelPostAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ViettelPostAuthService> _logger;
        
        private string? _accessToken;
        private DateTime _tokenExpiry = DateTime.MinValue;
        private readonly object _lockObject = new object();

        // Partner credentials
        private readonly string _partnerUsername;
        private readonly string _partnerPassword;
        private readonly string _baseUrl;

        public ViettelPostAuthService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ViettelPostAuthService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            var shippingConfig = _configuration.GetSection("Shipping:ViettelPost");
            _baseUrl = shippingConfig["BaseUrl"] ?? "https://partner.viettelpost.vn";
            
            // Set base URL for HttpClient
            _httpClient.BaseAddress = new Uri(_baseUrl);
            
            // Always setup partner credentials for auto-refresh capability
            _partnerUsername = Environment.GetEnvironmentVariable("VIETTELPOST_PARTNER_USERNAME") ?? "";
            _partnerPassword = Environment.GetEnvironmentVariable("VIETTELPOST_PARTNER_PASSWORD") ?? "";
            
            // Optional: Use static token as initial token (for faster startup)
            var staticToken = Environment.GetEnvironmentVariable("VIETTELPOST_TOKEN") ?? "";
            if (!string.IsNullOrEmpty(staticToken))
            {
                _accessToken = staticToken;
                _tokenExpiry = DateTime.UtcNow.AddMinutes(30); // Short expiry to force refresh soon
                _logger.LogInformation("🔑 Using initial static token, will auto-refresh when needed");
            }

            if (!string.IsNullOrEmpty(_partnerUsername) && !string.IsNullOrEmpty(_partnerPassword))
            {
                _logger.LogInformation("✅ ViettelPost auto-refresh enabled - system will handle token expiry automatically");
            }
            else
            {
                _logger.LogError("❌ No partner credentials configured - manual token management required");
            }

            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        public bool IsTokenValid()
        {
            lock (_lockObject)
            {
                return !string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiry.AddMinutes(-5);
            }
        }

        public async Task<string> GetValidTokenAsync()
        {
            // Check if current token is still valid (with buffer time)
            if (IsTokenValid())
            {
                lock (_lockObject)
                {
                    return _accessToken!;
                }
            }

            _logger.LogInformation("🔄 Current token expired or missing, refreshing...");
            
            // Token expired or missing, refresh it
            await RefreshTokenAsync();
            
            lock (_lockObject)
            {
                if (string.IsNullOrEmpty(_accessToken))
                {
                    throw new InvalidOperationException("Failed to obtain valid ViettelPost token after refresh");
                }
                return _accessToken;
            }
        }

        public async Task RefreshTokenAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Refreshing ViettelPost token...");

                // Always try to get fresh token via partner login
                if (!string.IsNullOrEmpty(_partnerUsername) && !string.IsNullOrEmpty(_partnerPassword))
                {
                    _logger.LogInformation("🔑 Getting fresh token via partner login...");
                    await LoginPartnerAsync();
                    _logger.LogInformation("✅ ViettelPost token refreshed successfully via partner login. Expires at: {Expiry}", _tokenExpiry);
                    return;
                }

                // Fallback to static token if partner login fails
                var staticToken = Environment.GetEnvironmentVariable("VIETTELPOST_TOKEN");
                if (!string.IsNullOrEmpty(staticToken))
                {
                    lock (_lockObject)
                    {
                        _accessToken = staticToken;
                        _tokenExpiry = DateTime.UtcNow.AddHours(24);
                    }
                    
                    _logger.LogWarning("⚠️ Using static ViettelPost token as fallback");
                    return;
                }

                throw new InvalidOperationException("No ViettelPost authentication method available - please configure partner credentials or static token");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to refresh ViettelPost token");
                throw;
            }
        }

        private async Task LoginPartnerAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Starting ViettelPost partner login...");
                _logger.LogInformation("🔍 Base URL: {BaseUrl}", _httpClient.BaseAddress);
                _logger.LogInformation("🔍 Username: {Username}", _partnerUsername);
                
                var loginRequest = new
                {
                    USERNAME = _partnerUsername,
                    PASSWORD = _partnerPassword
                };

                var jsonContent = JsonSerializer.Serialize(loginRequest);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("🔍 Full URL will be: {FullUrl}", $"{_httpClient.BaseAddress}v2/user/Login");
                _logger.LogInformation("🔍 Request payload: {Payload}", jsonContent);

                var response = await _httpClient.PostAsync("/v2/user/Login", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("📦 ViettelPost partner login response - Status: {Status}, Content: {Content}", 
                    response.StatusCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostLoginResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Status == 200 && !string.IsNullOrEmpty(result.Data?.Token))
                    {
                        lock (_lockObject)
                        {
                            _accessToken = result.Data.Token;
                            // Set expiry based on API response or default to 23 hours
                            var expiryHours = result.Data.Expired > 0 
                                ? TimeSpan.FromMilliseconds(result.Data.Expired - DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()).TotalHours 
                                : 23;
                            _tokenExpiry = DateTime.UtcNow.AddHours(Math.Max(1, expiryHours)); // Minimum 1 hour
                        }

                        _logger.LogInformation("ViettelPost partner login successful. UserId: {UserId}, Partner: {Partner}, Token expires at: {Expiry}", 
                            result.Data.UserId, result.Data.Partner, _tokenExpiry);
                    }
                    else
                    {
                        _logger.LogError("ViettelPost login API returned error - Status: {Status}, Message: {Message}", 
                            result?.Status, result?.Message);
                        throw new InvalidOperationException($"ViettelPost login failed: {result?.Message}");
                    }
                }
                else
                {
                    _logger.LogError("ViettelPost login HTTP error - Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new HttpRequestException($"ViettelPost login HTTP error: {response.StatusCode} - {responseContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during ViettelPost partner login");
                throw;
            }
        }
    }

    // Response DTOs
    public class ViettelPostLoginResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostLoginData? Data { get; set; }
    }

    public class ViettelPostLoginData
    {
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public int Partner { get; set; }
        public string Phone { get; set; } = string.Empty;
        public long Expired { get; set; }
        public string? Encrypted { get; set; }
        public int Source { get; set; }
    }
}