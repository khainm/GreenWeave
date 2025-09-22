using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace backend.Services
{
    /// <summary>
    /// Service for handling Viettel Post address APIs
    /// </summary>
    public class ViettelPostAddressService : IViettelPostAddressService
    {
        private readonly ViettelPostConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly ILogger<ViettelPostAddressService> _logger;
        private string? _accessToken;
        private DateTime _tokenExpiry = DateTime.MinValue;
        public ViettelPostAddressService(
            IOptions<ShippingConfiguration> shippingConfig,
            HttpClient httpClient,
            ILogger<ViettelPostAddressService> logger)
        {
            var config = shippingConfig.Value;
            _config = config.ViettelPost;
            _httpClient = httpClient;
            _logger = logger;

            _httpClient.BaseAddress = new Uri(_config.BaseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);
            
            _logger.LogInformation("ViettelPostAddressService initialized in Production mode with base URL: {BaseUrl}", 
                _config.BaseUrl);
        }

        public async Task<AddressApiResponse<List<AddressDto>>> GetProvincesAsync()
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync("/v2/categories/listProvince");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post provinces response: {Response}", responseContent);
                _logger.LogInformation("Response length: {Length}, IsSuccessStatusCode: {IsSuccess}", 
                    responseContent.Length, response.IsSuccessStatusCode);

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        var options = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var result = JsonSerializer.Deserialize<ViettelPostApiResponse<List<ProvinceData>>>(responseContent, options);
                        
                        _logger.LogInformation("Deserialized result: Status={Status}, Error={Error}, DataCount={DataCount}", 
                            result?.Status, result?.Error, result?.Data?.Count);
                        
                        if (result?.Status == 200 && !result.Error && result.Data != null)
                        {
                            var provinces = result.Data.Select(p => new AddressDto
                            {
                                Id = p.PROVINCE_ID,
                                Name = p.PROVINCE_NAME,
                                Code = p.PROVINCE_CODE
                            }).ToList();

                            return new AddressApiResponse<List<AddressDto>>
                            {
                                Success = true,
                                Message = "Lấy danh sách tỉnh/thành phố thành công",
                                Data = provinces
                            };
                        }
                        else
                        {
                            _logger.LogWarning("Failed to parse provinces: Status={Status}, Error={Error}, Data={Data}", 
                                result?.Status, result?.Error, result?.Data);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Failed to deserialize provinces response: {Response}", responseContent);
                        
                        // Fallback: Try to parse manually
                        try
                        {
                            using var doc = JsonDocument.Parse(responseContent);
                            if (doc.RootElement.TryGetProperty("status", out var status) && 
                                status.GetInt32() == 200 &&
                                doc.RootElement.TryGetProperty("error", out var error) && 
                                !error.GetBoolean() &&
                                doc.RootElement.TryGetProperty("data", out var dataArray))
                            {
                                var provinces = new List<AddressDto>();
                                foreach (var item in dataArray.EnumerateArray())
                                {
                                    provinces.Add(new AddressDto
                                    {
                                        Id = item.GetProperty("PROVINCE_ID").GetInt32(),
                                        Name = item.GetProperty("PROVINCE_NAME").GetString() ?? "",
                                        Code = item.GetProperty("PROVINCE_CODE").GetString() ?? ""
                                    });
                                }

                                return new AddressApiResponse<List<AddressDto>>
                                {
                                    Success = true,
                                    Message = "Lấy danh sách tỉnh/thành phố thành công (fallback parsing)",
                                    Data = provinces
                                };
                            }
                        }
                        catch (Exception fallbackEx)
                        {
                            _logger.LogError(fallbackEx, "Fallback parsing also failed");
                        }
                    }
                }

                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Không thể lấy danh sách tỉnh/thành phố",
                    Errors = new List<string> { responseContent }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provinces from Viettel Post");
                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách tỉnh/thành phố",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AddressApiResponse<List<AddressDto>>> GetDistrictsAsync(int provinceId)
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync($"/v2/categories/listDistrict?provinceId={provinceId}");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post districts response for province {ProvinceId}: {Response}", provinceId, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        var options = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var result = JsonSerializer.Deserialize<ViettelPostApiResponse<List<DistrictData>>>(responseContent, options);
                        
                        if (result?.Status == 200 && !result.Error && result.Data != null)
                        {
                            var districts = result.Data.Select(d => new AddressDto
                            {
                                Id = d.DISTRICT_ID,
                                Name = d.DISTRICT_NAME,
                                Code = d.DISTRICT_CODE
                            }).ToList();

                            return new AddressApiResponse<List<AddressDto>>
                            {
                                Success = true,
                                Message = "Lấy danh sách quận/huyện thành công",
                                Data = districts
                            };
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Failed to deserialize districts response: {Response}", responseContent);
                    }
                }

                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Không thể lấy danh sách quận/huyện",
                    Errors = new List<string> { responseContent }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting districts from Viettel Post for province {ProvinceId}", provinceId);
                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách quận/huyện",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AddressApiResponse<List<AddressDto>>> GetWardsAsync(int districtId)
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync($"/v2/categories/listWards?districtId={districtId}");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post wards response for district {DistrictId}: {Response}", districtId, responseContent);
                _logger.LogInformation("Response length: {Length}, IsSuccessStatusCode: {IsSuccess}", 
                    responseContent.Length, response.IsSuccessStatusCode);

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        var options = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var result = JsonSerializer.Deserialize<ViettelPostApiResponse<List<WardData>>>(responseContent, options);
                        
                        _logger.LogInformation("Deserialized wards result: Status={Status}, Error={Error}, DataCount={DataCount}", 
                            result?.Status, result?.Error, result?.Data?.Count);
                        
                        if (result?.Status == 200 && !result.Error && result.Data != null)
                        {
                            var wards = result.Data.Select(w => new AddressDto
                            {
                                Id = w.WARDS_ID,
                                Name = w.WARDS_NAME,
                                Code = w.WARDS_ID.ToString() // Use ID as code since API doesn't provide WARD_CODE
                            }).ToList();

                            return new AddressApiResponse<List<AddressDto>>
                            {
                                Success = true,
                                Message = "Lấy danh sách phường/xã thành công",
                                Data = wards
                            };
                        }
                        else
                        {
                            _logger.LogWarning("Failed to parse wards: Status={Status}, Error={Error}, Data={Data}", 
                                result?.Status, result?.Error, result?.Data);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Failed to deserialize wards response: {Response}", responseContent);
                        
                        // Fallback: Try to parse manually
                        try
                        {
                            using var doc = JsonDocument.Parse(responseContent);
                            if (doc.RootElement.TryGetProperty("status", out var status) && 
                                status.GetInt32() == 200 &&
                                doc.RootElement.TryGetProperty("error", out var error) && 
                                !error.GetBoolean() &&
                                doc.RootElement.TryGetProperty("data", out var dataArray))
                            {
                                var wards = new List<AddressDto>();
                                foreach (var item in dataArray.EnumerateArray())
                                {
                                    wards.Add(new AddressDto
                                    {
                                        Id = item.GetProperty("WARDS_ID").GetInt32(),
                                        Name = item.GetProperty("WARDS_NAME").GetString() ?? "",
                                        Code = item.GetProperty("WARDS_ID").GetInt32().ToString()
                                    });
                                }

                                return new AddressApiResponse<List<AddressDto>>
                                {
                                    Success = true,
                                    Message = "Lấy danh sách phường/xã thành công (fallback parsing)",
                                    Data = wards
                                };
                            }
                        }
                        catch (Exception fallbackEx)
                        {
                            _logger.LogError(fallbackEx, "Fallback parsing also failed");
                        }
                    }
                }

                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Không thể lấy danh sách phường/xã",
                    Errors = new List<string> { responseContent }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting wards from Viettel Post for district {DistrictId}", districtId);
                return new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách phường/xã",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AddressApiResponse<ProvinceWithDistrictsDto>> GetProvinceWithDistrictsAsync(int provinceId)
        {
            try
            {
                // Get province info
                var provincesResponse = await GetProvincesAsync();
                if (!provincesResponse.Success || provincesResponse.Data == null)
                {
                    return new AddressApiResponse<ProvinceWithDistrictsDto>
                    {
                        Success = false,
                        Message = "Không thể lấy thông tin tỉnh/thành phố",
                        Errors = provincesResponse.Errors
                    };
                }

                var province = provincesResponse.Data.FirstOrDefault(p => p.Id == provinceId);
                if (province == null)
                {
                    return new AddressApiResponse<ProvinceWithDistrictsDto>
                    {
                        Success = false,
                        Message = "Không tìm thấy tỉnh/thành phố",
                        Errors = new List<string> { "Province not found" }
                    };
                }

                // Get districts for this province
                var districtsResponse = await GetDistrictsAsync(provinceId);
                if (!districtsResponse.Success || districtsResponse.Data == null)
                {
                    return new AddressApiResponse<ProvinceWithDistrictsDto>
                    {
                        Success = false,
                        Message = "Không thể lấy danh sách quận/huyện",
                        Errors = districtsResponse.Errors
                    };
                }

                // Get wards for each district
                var districtsWithWards = new List<DistrictWithWardsDto>();
                foreach (var district in districtsResponse.Data)
                {
                    var wardsResponse = await GetWardsAsync(district.Id);
                    var wards = wardsResponse.Success ? wardsResponse.Data ?? new List<AddressDto>() : new List<AddressDto>();

                    districtsWithWards.Add(new DistrictWithWardsDto
                    {
                        Id = district.Id,
                        Name = district.Name,
                        Code = district.Code,
                        ProvinceId = provinceId,
                        Wards = wards
                    });
                }

                var result = new ProvinceWithDistrictsDto
                {
                    Id = province.Id,
                    Name = province.Name,
                    Code = province.Code,
                    Districts = districtsWithWards
                };

                return new AddressApiResponse<ProvinceWithDistrictsDto>
                {
                    Success = true,
                    Message = "Lấy thông tin tỉnh/thành phố với quận/huyện thành công",
                    Data = result
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting province with districts from Viettel Post for province {ProvinceId}", provinceId);
                return new AddressApiResponse<ProvinceWithDistrictsDto>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy thông tin tỉnh/thành phố",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AddressWarningResult> CheckAddressWarningAsync(int wardId)
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync($"/v2/categories/checkAddressWarning?wardId={wardId}");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post address warning response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostAddressWarningResponse>(responseContent);
                    
                    if (result?.Status == 200)
                    {
                        return new AddressWarningResult
                        {
                            HasWarning = result.Data?.HasWarning ?? false,
                            WarningMessage = result.Data?.WarningMessage ?? "",
                            IsValid = !(result.Data?.HasWarning ?? false)
                        };
                    }
                }

                return new AddressWarningResult
                {
                    HasWarning = false,
                    WarningMessage = "",
                    IsValid = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking address warning from Viettel Post for ward {WardId}", wardId);
                return new AddressWarningResult
                {
                    HasWarning = false,
                    WarningMessage = "",
                    IsValid = true
                };
            }
        }

        // Private helper methods

        private async Task EnsureAuthenticatedAsync()
        {
            if (string.IsNullOrEmpty(_accessToken) || DateTime.UtcNow >= _tokenExpiry)
            {
                await AuthenticateAsync();
            }
        }

        private Task AuthenticateAsync()
        {
            try
            {
                // Use token directly from configuration
                _accessToken = _config.Token;
                _tokenExpiry = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours
                
                _logger.LogInformation("Using Viettel Post token from configuration for address service");
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Viettel Post token for address service");
                throw;
            }
        }
    }

    #region Response Models for Viettel Post Address API
    // ViettelPostAuthData is defined in ViettelPostShippingProvider.cs
    
    public class ProvinceData
    {
        public int PROVINCE_ID { get; set; }
        public string PROVINCE_CODE { get; set; } = string.Empty;
        public string PROVINCE_NAME { get; set; } = string.Empty;
    }

    public class DistrictData
    {
        public int DISTRICT_ID { get; set; }
        public string DISTRICT_CODE { get; set; } = string.Empty;
        public string DISTRICT_NAME { get; set; } = string.Empty;
    }

    public class WardData
    {
        public int WARDS_ID { get; set; }
        public string WARDS_NAME { get; set; } = string.Empty;
        public int DISTRICT_ID { get; set; }
    }
    #endregion
}
