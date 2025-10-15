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
            _baseUrl = shippingConfig["BaseUrl"] ?? "https://partner.viettelpost.vn/v2";
            
            // Partner credentials for auto-refresh
            _partnerUsername = Environment.GetEnvironmentVariable("VIETTELPOST_PARTNER_USERNAME") ?? "";
            _partnerPassword = Environment.GetEnvironmentVariable("VIETTELPOST_PARTNER_PASSWORD") ?? "";
            
            if (!string.IsNullOrEmpty(_partnerUsername) && !string.IsNullOrEmpty(_partnerPassword))
            {
                _logger.LogInformation("ViettelPost auto-refresh enabled with partner credentials");
            }
            else
            {
                // Only use static token as last resort
                var staticToken = Environment.GetEnvironmentVariable("VIETTELPOST_TOKEN") ?? "";
                if (!string.IsNullOrEmpty(staticToken))
                {
                    _accessToken = staticToken;
                    _tokenExpiry = DateTime.UtcNow.AddHours(24); // Conservative expiry
                    _logger.LogWarning("Using static ViettelPost token - auto-refresh preferred");
                }
                else
                {
                    _logger.LogError("No ViettelPost authentication method configured");
                }
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
            // Check if current token is still valid
            if (IsTokenValid())
            {
                lock (_lockObject)
                {
                    return _accessToken!;
                }
            }

            // Token expired or missing, refresh it
            await RefreshTokenAsync();
            
            lock (_lockObject)
            {
                return _accessToken ?? throw new InvalidOperationException("Failed to obtain valid ViettelPost token");
            }
        }

        public async Task RefreshTokenAsync()
        {
            try
            {
                _logger.LogInformation("Refreshing ViettelPost token...");

                // Prioritize partner login if credentials available
                if (!string.IsNullOrEmpty(_partnerUsername) && !string.IsNullOrEmpty(_partnerPassword))
                {
                    _logger.LogInformation("Using partner credentials for auto token refresh");
                    await LoginPartnerAsync();
                    _logger.LogInformation("ViettelPost token refreshed successfully via partner login. Expires at: {Expiry}", _tokenExpiry);
                }
                else
                {
                    // Only use static token if partner credentials not available
                    var staticToken = Environment.GetEnvironmentVariable("VIETTELPOST_TOKEN");
                    if (!string.IsNullOrEmpty(staticToken))
                    {
                        lock (_lockObject)
                        {
                            _accessToken = staticToken;
                            _tokenExpiry = DateTime.UtcNow.AddHours(24);
                        }
                        
                        _logger.LogWarning("Using static ViettelPost token - partner credentials recommended for auto-refresh");
                    }
                    else
                    {
                        throw new InvalidOperationException("No ViettelPost authentication method available - please configure partner credentials");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh ViettelPost token");
                throw;
            }
        }

        private async Task LoginPartnerAsync()
        {
            try
            {
                var loginRequest = new
                {
                    USERNAME = _partnerUsername,
                    PASSWORD = _partnerPassword
                };

                var jsonContent = JsonSerializer.Serialize(loginRequest);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/user/Login", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ViettelPost partner login attempt - Status: {Status}", response.StatusCode);

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