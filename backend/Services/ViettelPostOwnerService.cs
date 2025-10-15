using System.Text.Json;
using System.Text;
using backend.Interfaces.Services;
using backend.DTOs;

namespace backend.Services
{
    public interface IViettelPostOwnerService
    {
        Task<string> GetOwnerTokenAsync(string ownerEmail, string ownerPhone, string ownerName, string ownerAddress, int wardsId);
        Task<string> ConnectOwnerAsync(string ownerUsername, string ownerPassword);
        Task<ListInventoryResult> GetOwnerInventoryAsync(string ownerToken);
        Task<ListInventoryResult> GetCurrentUserInventoryAsync();
    }

    public class ViettelPostOwnerService : IViettelPostOwnerService
    {
        private readonly HttpClient _httpClient;
        private readonly IViettelPostAuthService _authService;
        private readonly ILogger<ViettelPostOwnerService> _logger;
        private readonly string _baseUrl;

        // Cache owner tokens by email/username
        private readonly Dictionary<string, (string token, DateTime expiry)> _ownerTokenCache = new();
        private readonly object _cacheLock = new object();

        public ViettelPostOwnerService(
            HttpClient httpClient,
            IViettelPostAuthService authService,
            ILogger<ViettelPostOwnerService> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _authService = authService;
            _logger = logger;

            var shippingConfig = configuration.GetSection("Shipping:ViettelPost");
            _baseUrl = shippingConfig["BaseUrl"] ?? "https://partner.viettelpost.vn/v2";
            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        public async Task<string> GetOwnerTokenAsync(string ownerEmail, string ownerPhone, string ownerName, string ownerAddress, int wardsId)
        {
            try
            {
                // Check cache first
                lock (_cacheLock)
                {
                    if (_ownerTokenCache.TryGetValue(ownerEmail, out var cached) && 
                        DateTime.UtcNow < cached.expiry.AddMinutes(-5))
                    {
                        _logger.LogDebug("Using cached owner token for {Email}", ownerEmail);
                        return cached.token;
                    }
                }

                // Get partner token
                var partnerToken = await _authService.GetValidTokenAsync();

                // Try to register owner (API 2)
                var registerResult = await RegisterOwnerAsync(partnerToken, ownerEmail, ownerPhone, ownerName, ownerAddress, wardsId);
                
                if (registerResult.Success)
                {
                    _logger.LogInformation("Owner registered successfully: {Email}", ownerEmail);
                    CacheOwnerToken(ownerEmail, registerResult.Token, registerResult.Expiry);
                    return registerResult.Token;
                }
                else if (registerResult.ErrorCode == 206) // Account already exists
                {
                    _logger.LogInformation("Owner already exists, attempting to connect: {Email}", ownerEmail);
                    // Owner exists, try to connect (would need password - this is limitation)
                    throw new InvalidOperationException($"Owner {ownerEmail} already exists. Use ConnectOwnerAsync with credentials.");
                }
                else
                {
                    throw new InvalidOperationException($"Failed to register owner: {registerResult.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting owner token for {Email}", ownerEmail);
                throw;
            }
        }

        public async Task<string> ConnectOwnerAsync(string ownerUsername, string ownerPassword)
        {
            try
            {
                // Check cache first
                lock (_cacheLock)
                {
                    if (_ownerTokenCache.TryGetValue(ownerUsername, out var cached) && 
                        DateTime.UtcNow < cached.expiry.AddMinutes(-5))
                    {
                        _logger.LogDebug("Using cached owner token for {Username}", ownerUsername);
                        return cached.token;
                    }
                }

                // Get partner token
                var partnerToken = await _authService.GetValidTokenAsync();

                // Connect owner (API 3)
                var connectRequest = new
                {
                    USERNAME = ownerUsername,
                    PASSWORD = ownerPassword
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", partnerToken);

                var jsonContent = JsonSerializer.Serialize(connectRequest);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/user/ownerconnect", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ViettelPost owner connect response: Status {Status}", response.StatusCode);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostOwnerResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Status == 200 && !string.IsNullOrEmpty(result.Data?.Token))
                    {
                        var ownerToken = result.Data.Token;
                        var expiry = result.Data.Expired > 0 
                            ? DateTime.FromBinary(result.Data.Expired)
                            : DateTime.UtcNow.AddHours(23);

                        CacheOwnerToken(ownerUsername, ownerToken, expiry);
                        
                        _logger.LogInformation("Owner connected successfully: {Username}", ownerUsername);
                        return ownerToken;
                    }
                    else
                    {
                        throw new InvalidOperationException($"Owner connect failed: {result?.Message}");
                    }
                }
                else
                {
                    throw new HttpRequestException($"Owner connect HTTP error: {response.StatusCode} - {responseContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting owner {Username}", ownerUsername);
                throw;
            }
        }

        public async Task<ListInventoryResult> GetOwnerInventoryAsync(string ownerToken)
        {
            try
            {
                _logger.LogInformation("Getting inventory list for owner token: {Token}", ownerToken?.Substring(0, 10) + "...");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", ownerToken);

                var response = await _httpClient.GetAsync("/v2/user/listInventory");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ViettelPost owner listInventory response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var result = JsonSerializer.Deserialize<ViettelPostListInventoryResponse>(responseContent, options);
                    
                    if (result?.Status == 200 && result.Data != null)
                    {
                        var inventories = result.Data.Select(d => new InventoryData
                        {
                            GroupAddressId = d.groupaddressId,
                            CusId = d.cusId,
                            Name = d.name,
                            Phone = d.phone,
                            Address = d.address,
                            ProvinceId = d.provinceId,
                            DistrictId = d.districtId,
                            WardsId = d.wardsId
                        }).ToList();

                        return new ListInventoryResult
                        {
                            IsSuccess = true,
                            Message = "Lấy danh sách kho hàng owner thành công",
                            Inventories = inventories
                        };
                    }
                    else
                    {
                        string errorMessage = result?.Status switch
                        {
                            201 => "Account have logged in on another machine! - Tài khoản đã đăng nhập trên thiết bị khác",
                            202 => "Correct delivery note - Phiếu giao hàng chính xác", 
                            205 => "System error - Lỗi hệ thống ViettelPost",
                            _ => result?.Message ?? "Không thể lấy danh sách kho hàng"
                        };
                        
                        _logger.LogWarning("ViettelPost owner listInventory API error: Status={Status}, Error={Error}, Message={Message}", 
                            result?.Status, result?.Error, result?.Message);
                        
                        return new ListInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = errorMessage
                        };
                    }
                }

                return new ListInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"ViettelPost API error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting owner inventory list from ViettelPost");
                return new ListInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<ListInventoryResult> GetCurrentUserInventoryAsync()
        {
            try
            {
                // Use the partner authentication first
                var partnerToken = await _authService.GetValidTokenAsync();
                return await GetOwnerInventoryAsync(partnerToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user inventory");
                return new ListInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<OwnerRegisterResult> RegisterOwnerAsync(string partnerToken, string email, string phone, string name, string address, int wardsId)
        {
            try
            {
                var registerRequest = new
                {
                    EMAIL = email,
                    PHONE = phone,
                    NAME = name,
                    ADDRESS = address,
                    WARDS_ID = wardsId
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", partnerToken);

                var jsonContent = JsonSerializer.Serialize(registerRequest);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/user/ownerRegister", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ViettelPost owner register response: Status {Status}", response.StatusCode);

                var result = JsonSerializer.Deserialize<ViettelPostOwnerResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result?.Status == 200)
                {
                    var expiry = result.Data?.Expired > 0 
                        ? DateTime.FromBinary(result.Data.Expired)
                        : DateTime.UtcNow.AddHours(23);

                    return new OwnerRegisterResult
                    {
                        Success = true,
                        Token = result.Data?.Token ?? "",
                        Expiry = expiry
                    };
                }
                else
                {
                    return new OwnerRegisterResult
                    {
                        Success = false,
                        ErrorCode = result?.Status ?? 0,
                        ErrorMessage = result?.Message ?? "Unknown error"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering owner");
                return new OwnerRegisterResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private void CacheOwnerToken(string key, string token, DateTime expiry)
        {
            lock (_cacheLock)
            {
                _ownerTokenCache[key] = (token, expiry);
            }
        }
    }

    // DTOs
    public class ViettelPostOwnerResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostOwnerData? Data { get; set; }
    }

    public class ViettelPostOwnerData
    {
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public int Partner { get; set; }
        public string Phone { get; set; } = string.Empty;
        public long Expired { get; set; }
        public string? Encrypted { get; set; }
        public int Source { get; set; }
    }

    public class OwnerRegisterResult
    {
        public bool Success { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime Expiry { get; set; }
        public int ErrorCode { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}