using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace backend.Services
{
    /// <summary>
    /// Viettel Post shipping provider implementation
    /// </summary>
    public class ViettelPostShippingProvider : IShippingProvider
    {
        private readonly ViettelPostConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly ILogger<ViettelPostShippingProvider> _logger;
        private readonly IViettelPostAddressService _addressService;
        private string? _accessToken;
        private DateTime _tokenExpiry = DateTime.MinValue;
        public ShippingProvider Provider => ShippingProvider.ViettelPost;

        public ViettelPostShippingProvider(
            IOptions<ShippingConfiguration> shippingConfig,
            HttpClient httpClient,
            ILogger<ViettelPostShippingProvider> logger,
            IViettelPostAddressService addressService)
        {
            var config = shippingConfig.Value;
            _config = config.ViettelPost;
            _httpClient = httpClient;
            _logger = logger;
            _addressService = addressService;

            _httpClient.BaseAddress = new Uri(_config.BaseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);
            
            _logger.LogInformation("ViettelPostShippingProvider initialized in Production mode with base URL: {BaseUrl}", 
                _config.BaseUrl);
        }

        public Task<bool> IsAvailableAsync()
        {
            return Task.FromResult(_config.IsEnabled && 
                   !string.IsNullOrEmpty(_config.Token) && 
                   !string.IsNullOrEmpty(_config.PartnerID));
        }

        public async Task<FeeResult> CalculateFeeAsync(CalculateShippingFeeRequest request)
        {
            try
            {
                _logger.LogInformation("Calculating ViettelPost shipping fee");
                _logger.LogInformation("  📦 Weight: {Weight}g, Price: {Price} VND, COD: {CodAmount} VND", 
                    request.Weight, request.InsuranceValue, request.CodAmount);
                _logger.LogInformation("  🏠 From: {FromProvince}, {FromDistrict}", 
                    request.FromAddress.Province, request.FromAddress.District);
                _logger.LogInformation("  📍 To: {ToProvince}, {ToDistrict}", 
                    request.ToAddress.Province, request.ToAddress.District);

                await EnsureAuthenticatedAsync();

                var senderProvinceId = request.FromAddress.ProvinceId ?? await GetProvinceIdAsync(request.FromAddress.Province);
                var senderDistrictId = request.FromAddress.DistrictId ?? await GetDistrictIdAsync(request.FromAddress.District, senderProvinceId);
                var receiverProvinceId = request.ToAddress.ProvinceId ?? await GetProvinceIdAsync(request.ToAddress.Province);
                var receiverDistrictId = request.ToAddress.DistrictId ?? await GetDistrictIdAsync(request.ToAddress.District, receiverProvinceId);

                var payload = new
                {
                    SENDER_PROVINCE = senderProvinceId,
                    SENDER_DISTRICT = senderDistrictId,
                    RECEIVER_PROVINCE = receiverProvinceId,
                    RECEIVER_DISTRICT = receiverDistrictId,
                    PRODUCT_TYPE = "HH",
                    PRODUCT_WEIGHT = request.Weight,
                    PRODUCT_PRICE = request.InsuranceValue,
                    MONEY_COLLECTION = request.CodAmount.ToString(),
                    TYPE = 1
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.PostAsync("/v2/order/getPriceAll",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Viettel Post fee calculation response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    
                    // Try to deserialize as array first (success case)
                    try
                    {
                        var services = JsonSerializer.Deserialize<List<ViettelPostPriceAllResponse>>(responseContent, options);
                        _logger.LogInformation("Deserialized price all result as array: {Count} services found", services?.Count ?? 0);
                        
                        if (services != null && services.Count > 0)
                        {
                            // Service mapping for user-friendly names
                            // Only for the 3 specific services we want to display
                            var serviceMapping = new Dictionary<string, (string Name, string Description)>
                            {
                                { "SHT", ("Chuyển phát hỏa tốc", "Giao hàng hỏa tốc") },
                                { "SCN", ("Chuyển phát nhanh", "Giao hàng nhanh") },
                                { "STK", ("Chuyển phát tiêu chuẩn", "Giao hàng tiêu chuẩn") }
                            };
                            
                            // Find the requested service or use the first one
                            var selectedService = services.FirstOrDefault(s => s.MA_DV_CHINH == (request.ServiceId ?? _config.DefaultServiceId)) ?? services.First();
                            
                            _logger.LogInformation("Selected service: {ServiceCode} - {ServiceName}, Price: {Price}", 
                                selectedService.MA_DV_CHINH, selectedService.TEN_DICHVU, selectedService.GIA_CUOC);
                            
                            // Get user-friendly name
                            var friendlyName = serviceMapping.ContainsKey(selectedService.MA_DV_CHINH) 
                                ? serviceMapping[selectedService.MA_DV_CHINH].Name 
                                : selectedService.TEN_DICHVU;
                            
                            return new FeeResult
                            {
                                IsSuccess = true,
                                Fee = selectedService.GIA_CUOC,
                                ServiceId = selectedService.MA_DV_CHINH,
                                ServiceName = friendlyName,
                                EstimatedDeliveryDays = ParseDeliveryTime(selectedService.THOI_GIAN),
                                AdditionalData = new Dictionary<string, object>
                                {
                                    ["viettelpost_response"] = services,
                                    ["selected_service"] = selectedService
                                }
                            };
                        }
                    }
                    catch (JsonException)
                    {
                        // Try to deserialize as error response
                        try
                        {
                            var errorResponse = JsonSerializer.Deserialize<ViettelPostErrorResponse>(responseContent, options);
                            _logger.LogWarning("Viettel Post API returned error: {Status} - {Message}", 
                                errorResponse?.Status, errorResponse?.Message);
                            
                            return new FeeResult
                            {
                                IsSuccess = false,
                                ErrorMessage = errorResponse?.Message ?? "Viettel Post API error"
                            };
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogError(ex, "Failed to deserialize Viettel Post response: {Response}", responseContent);
                        }
                    }
                }

                return new FeeResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Viettel Post API error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating Viettel Post shipping fee");
                return new FeeResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<CreateShipmentResult> CreateShipmentAsync(Order order, ShippingRequest shippingRequest)
        {
            try
            {
                _logger.LogInformation("Creating shipment in Production mode for order {OrderNumber}", 
                    order.OrderNumber);

                await EnsureAuthenticatedAsync();

                var fromAddress = JsonSerializer.Deserialize<ShippingAddressDto>(shippingRequest.FromAddress);
                var toAddress = JsonSerializer.Deserialize<ShippingAddressDto>(shippingRequest.ToAddress);
                
                // Validate required address IDs for createOrder
                if (toAddress?.WardId == null || toAddress?.DistrictId == null || toAddress?.ProvinceId == null)
                {
                    throw new InvalidOperationException("Complete address information (ProvinceId, DistrictId, WardId) is required for creating shipment");
                }

                // Calculate total weight and dimensions
                var totalWeight = order.Items.Sum(i => i.Product.Weight * i.Quantity);
                var totalPrice = order.Items.Sum(i => i.Product.Price * i.Quantity);
                
                // Create LIST_ITEM for detailed product information
                var listItems = order.Items.Select(item => new
                {
                    PRODUCT_NAME = item.Product.Name,
                    PRODUCT_PRICE = (int)item.Product.Price,
                    PRODUCT_WEIGHT = (int)item.Product.Weight,
                    PRODUCT_QUANTITY = item.Quantity
                }).ToArray();

                var payload = new
                {
                    ORDER_NUMBER = order.OrderNumber,
                    GROUPADDRESS_ID = 0,
                    CUS_ID = 0,
                    DELIVERY_DATE = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"),
                    SENDER_FULLNAME = fromAddress?.Name ?? _config.DefaultPickupAddress.Name,
                    SENDER_ADDRESS = fromAddress?.AddressDetail ?? _config.DefaultPickupAddress.AddressDetail,
                    SENDER_PHONE = fromAddress?.Phone ?? _config.DefaultPickupAddress.Phone,
                    SENDER_EMAIL = "",
                    SENDER_WARD = fromAddress?.WardId ?? _config.DefaultPickupAddress.WardId,
                    SENDER_DISTRICT = fromAddress?.DistrictId ?? _config.DefaultPickupAddress.DistrictId,
                    SENDER_PROVINCE = fromAddress?.ProvinceId ?? _config.DefaultPickupAddress.ProvinceId,
                    SENDER_LATITUDE = 0,
                    SENDER_LONGITUDE = 0,
                    RECEIVER_FULLNAME = toAddress?.Name,
                    RECEIVER_ADDRESS = toAddress?.AddressDetail,
                    RECEIVER_PHONE = toAddress?.Phone,
                    RECEIVER_EMAIL = order.Customer.Email,
                    RECEIVER_WARD = toAddress?.WardId ?? throw new InvalidOperationException("WardId is required for creating shipment"),
                    RECEIVER_DISTRICT = toAddress?.DistrictId ?? await GetDistrictIdAsync(toAddress?.District ?? "", toAddress?.ProvinceId ?? await GetProvinceIdAsync(toAddress?.Province ?? "")),
                    RECEIVER_PROVINCE = toAddress?.ProvinceId ?? await GetProvinceIdAsync(toAddress?.Province ?? ""),
                    RECEIVER_LATITUDE = 0,
                    RECEIVER_LONGITUDE = 0,
                    PRODUCT_NAME = $"Đơn hàng {order.OrderNumber}",
                    PRODUCT_DESCRIPTION = $"Đơn hàng GreenWeave #{order.OrderNumber}",
                    PRODUCT_QUANTITY = order.Items.Sum(i => i.Quantity),
                    PRODUCT_PRICE = (int)totalPrice,
                    PRODUCT_WEIGHT = (int)totalWeight,
                    PRODUCT_LENGTH = 0,
                    PRODUCT_WIDTH = 0,
                    PRODUCT_HEIGHT = 0,
                    PRODUCT_TYPE = "HH",
                    ORDER_PAYMENT = order.PaymentMethod == PaymentMethod.CashOnDelivery ? 3 : 1, // 3 = COD, 1 = Người gửi thanh toán
                    ORDER_SERVICE = "VCN", // Dịch vụ chuyển phát nhanh
                    ORDER_SERVICE_ADD = "",
                    ORDER_VOUCHER = "",
                    ORDER_NOTE = shippingRequest.Note ?? "",
                    MONEY_COLLECTION = order.PaymentMethod == PaymentMethod.CashOnDelivery ? (int)shippingRequest.CodAmount : 0,
                    MONEY_TOTALFEE = 0,
                    MONEY_FEECOD = 0,
                    MONEY_FEEVAS = 0,
                    MONEY_FEEINSURRANCE = 0,
                    MONEY_FEE = 0,
                    MONEY_FEEOTHER = 0,
                    MONEY_TOTALVAT = 0,
                    MONEY_TOTAL = 0,
                    LIST_ITEM = listItems
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.PostAsync("/v2/order/createOrder",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Viettel Post create shipment response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostCreateOrderResponse>(responseContent);
                    
                    if (result?.Status == 200 && result.Data != null)
                    {
                        // Generate tracking code
                        var trackingCode = result.Data.ORDER_NUMBER;

                        return new CreateShipmentResult
                        {
                            IsSuccess = true,
                            TrackingCode = trackingCode,
                            ExternalId = result.Data.ORDER_NUMBER,
                            TotalFee = result.Data.MONEY_TOTAL,
                            AdditionalData = new Dictionary<string, object>
                            {
                                ["viettelpost_response"] = result,
                                ["is_production"] = true
                            }
                        };
                    }
                }

                // Log error and return failure
                _logger.LogError("Viettel Post API returned error for order {OrderNumber}", order.OrderNumber);

                return new CreateShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Viettel Post API error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Viettel Post shipment for order {OrderId}", order.Id);
                return new CreateShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<CancelShipmentResult> CancelShipmentAsync(string trackingCode, string reason)
        {
            try
            {
                await EnsureAuthenticatedAsync();

                var payload = new
                {
                    TYPE = 1, // Cancel type
                    NOTE = reason,
                    LIST_ORDER_NUMBER = new[] { trackingCode }
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.PostAsync("/v2/order/cancel",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    return new CancelShipmentResult
                    {
                        IsSuccess = true,
                        CancelReason = reason
                    };
                }

                return new CancelShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Viettel Post cancel error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling Viettel Post shipment {TrackingCode}", trackingCode);
                return new CancelShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<TrackingResult> GetTrackingAsync(string trackingCode)
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync($"/v2/order/getOrder?ORDER_NUMBER={trackingCode}");
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostTrackingResponse>(responseContent);
                    
                    if (result?.Status == 200 && result.Data != null)
                    {
                        var status = MapViettelPostStatus(result.Data.ORDER_STATUS);
                        var events = new List<TrackingEvent>
                        {
                            new TrackingEvent
                            {
                                Timestamp = DateTime.Parse(result.Data.ORDER_DATE),
                                Status = result.Data.ORDER_STATUS.ToString(),
                                Description = GetStatusDescription(result.Data.ORDER_STATUS),
                                Location = result.Data.SENDER_PROVINCE_NAME
                            }
                        };

                        return new TrackingResult
                        {
                            IsSuccess = true,
                            Status = status,
                            StatusDescription = GetStatusDescription(result.Data.ORDER_STATUS),
                            Events = events,
                            AdditionalData = new Dictionary<string, object>
                            {
                                ["viettelpost_response"] = result
                            }
                        };
                    }
                }

                return new TrackingResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Viettel Post tracking error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking Viettel Post shipment {TrackingCode}", trackingCode);
                return new TrackingResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public Task<ShippingWebhookDto?> ProcessWebhookAsync(string webhookData)
        {
            try
            {
                var data = JsonSerializer.Deserialize<Dictionary<string, object>>(webhookData);
                
                if (data != null && data.ContainsKey("ORDER_NUMBER") && data.ContainsKey("ORDER_STATUS"))
                {
                    return Task.FromResult<ShippingWebhookDto?>(new ShippingWebhookDto
                    {
                        TrackingCode = data["ORDER_NUMBER"].ToString() ?? "",
                        Status = data["ORDER_STATUS"].ToString() ?? "",
                        Timestamp = DateTime.UtcNow,
                        RawData = data
                    });
                }

                return Task.FromResult<ShippingWebhookDto?>(null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Viettel Post webhook data");
                return Task.FromResult<ShippingWebhookDto?>(null);
            }
        }

        public async Task<List<ShippingServiceDto>> GetAvailableServicesAsync()
        {
            try
            {
                await EnsureAuthenticatedAsync();

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.GetAsync("/v2/categories/listService");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post services response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostServicesResponse>(responseContent);
                    
                    if (result?.Status == 200 && result.Data?.ListService != null)
                    {
                        return result.Data.ListService.Select(s => new ShippingServiceDto
                        {
                            ServiceId = s.SERVICE_CODE,
                            ServiceName = s.SERVICE_NAME,
                            Description = s.SERVICE_DESCRIPTION ?? s.SERVICE_NAME,
                            EstimatedDeliveryDays = ParseDeliveryTime(s.SERVICE_DESCRIPTION ?? "3 ngày")
                        }).ToList();
                    }
                }

                // No fallback - return empty list if API fails
                _logger.LogError("ViettelPost services API failed, returning empty list");
                return new List<ShippingServiceDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Viettel Post services");
                return new List<ShippingServiceDto>();
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
                _logger.LogError(ex, "Error checking address warning for ward {WardId}", wardId);
                return new AddressWarningResult
                {
                    HasWarning = false,
                    WarningMessage = "",
                    IsValid = true
                };
            }
        }

        public async Task<List<ShippingOptionDto>> GetShippingOptionsAsync(CalculateShippingFeeRequest request)
        {
            const int maxRetries = 3;
            const int retryDelayMs = 1000;

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    _logger.LogInformation("Getting all shipping options for order from {FromProvince} to {ToProvince} (attempt {Attempt}/{MaxRetries})", 
                        request.FromAddress.Province, 
                        request.ToAddress.Province,
                        attempt, maxRetries);

                    await EnsureAuthenticatedAsync();

                var senderProvinceId = request.FromAddress.ProvinceId ?? await GetProvinceIdAsync(request.FromAddress.Province);
                var senderDistrictId = request.FromAddress.DistrictId ?? await GetDistrictIdAsync(request.FromAddress.District, senderProvinceId);
                var receiverProvinceId = request.ToAddress.ProvinceId ?? await GetProvinceIdAsync(request.ToAddress.Province);
                var receiverDistrictId = request.ToAddress.DistrictId ?? await GetDistrictIdAsync(request.ToAddress.District, receiverProvinceId);

                _logger.LogInformation("=== ADDRESS MAPPING DEBUG ===");
                _logger.LogInformation("FROM: {FromProvince} -> ID: {FromProvinceId}, {FromDistrict} -> ID: {FromDistrictId}", 
                    request.FromAddress.Province, senderProvinceId, request.FromAddress.District, senderDistrictId);
                _logger.LogInformation("TO: {ToProvince} -> ID: {ToProvinceId}, {ToDistrict} -> ID: {ToDistrictId}", 
                    request.ToAddress.Province, receiverProvinceId, request.ToAddress.District, receiverDistrictId);
                _logger.LogInformation("🏠 FROM ADDRESS: {FromAddress}", 
                    $"{request.FromAddress.AddressDetail}, {request.FromAddress.Ward}, {request.FromAddress.District}, {request.FromAddress.Province}");
                _logger.LogInformation("📦 TO ADDRESS: {ToAddress}", 
                    $"{request.ToAddress.AddressDetail}, {request.ToAddress.Ward}, {request.ToAddress.District}, {request.ToAddress.Province}");
                _logger.LogInformation("=== END ADDRESS MAPPING ===");

                var payload = new
                {
                    SENDER_PROVINCE = senderProvinceId,
                    SENDER_DISTRICT = senderDistrictId,
                    RECEIVER_PROVINCE = receiverProvinceId,
                    RECEIVER_DISTRICT = receiverDistrictId,
                    PRODUCT_TYPE = "HH",
                    PRODUCT_WEIGHT = request.Weight,
                    PRODUCT_PRICE = request.InsuranceValue,
                    MONEY_COLLECTION = request.CodAmount.ToString(),
                    TYPE = 1
                };
                
                _logger.LogInformation("📤 [API REQUEST] ViettelPost payload:");
                _logger.LogInformation("  🏠 From: Province {FromProvinceId}, District {FromDistrictId}", 
                    senderProvinceId, senderDistrictId);
                _logger.LogInformation("  📦 To: Province {ToProvinceId}, District {ToDistrictId}", 
                    receiverProvinceId, receiverDistrictId);
                _logger.LogInformation("  ⚖️ Weight: {Weight}g, Price: {Price} VND, COD: {CodAmount} VND", 
                    request.Weight, request.InsuranceValue, request.CodAmount);
                
                // Check if it's intra-province delivery
                var isIntraProvince = senderProvinceId == receiverProvinceId;
                _logger.LogInformation("🚚 Delivery type: {DeliveryType} (Same province: {IsIntraProvince})", 
                    isIntraProvince ? "Nội tỉnh" : "Liên tỉnh", isIntraProvince);

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", _accessToken);

                var response = await _httpClient.PostAsync("/v2/order/getPriceAll",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Viettel Post get all options response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    
                    try
                    {
                        var services = JsonSerializer.Deserialize<List<ViettelPostPriceAllResponse>>(responseContent, options);
                        _logger.LogInformation("Deserialized price all result as array: {Count} services found", services?.Count ?? 0);
                        
                            if (services != null && services.Count > 0)
                            {
                                var shippingOptions = new List<ShippingOptionDto>();
                                
                                // Map ViettelPost service codes to user-friendly names
                                // Only for the 3 specific services we want to display
                                var serviceMapping = new Dictionary<string, (string Name, string Description)>
                                {
                                    { "SHT", ("Chuyển phát hỏa tốc", "Giao hàng hỏa tốc") },
                                    { "SCN", ("Chuyển phát nhanh", "Giao hàng nhanh") },
                                    { "STK", ("Chuyển phát tiêu chuẩn", "Giao hàng tiêu chuẩn") }
                                };
                                
                                _logger.LogInformation("🔍 [API DEBUG] All services from ViettelPost API:");
                                foreach (var service in services)
                                {
                                    _logger.LogInformation("  📦 {ServiceCode}: {ServiceName} - {Price} VND - {Time}", 
                                        service.MA_DV_CHINH, service.TEN_DICHVU, service.GIA_CUOC, service.THOI_GIAN);
                                }
                                
                                _logger.LogInformation("🌐 [SERVICE MAPPING] Available services:");
                                foreach (var mapping in serviceMapping)
                                {
                                    _logger.LogInformation("  📦 {ServiceCode}: {ServiceName} - {Description}", 
                                        mapping.Key, mapping.Value.Name, mapping.Value.Description);
                                }
                                
                                foreach (var service in services)
                                {
                                    _logger.LogInformation("Processing service: {ServiceCode} - {ServiceName}, Price: {Price}", 
                                        service.MA_DV_CHINH, service.TEN_DICHVU, service.GIA_CUOC);
                                    
                                    // Only include the 3 specific services: SHT, SCN, STK
                                    var allowedServices = new[] { "SHT", "SCN", "STK" };
                                    if (allowedServices.Contains(service.MA_DV_CHINH))
                                    {
                                        try
                                        {
                                        var deliveryDays = ParseDeliveryTime(service.THOI_GIAN);
                                        _logger.LogInformation("🔍 [DELIVERY TIME DEBUG] Service {ServiceCode}: {ServiceName}", 
                                            service.MA_DV_CHINH, service.TEN_DICHVU);
                                        _logger.LogInformation("💰 Price: {Price} VND", service.GIA_CUOC);
                                        _logger.LogInformation("⏰ Raw time string: '{TimeString}'", service.THOI_GIAN);
                                        _logger.LogInformation("📅 Parsed delivery days: {DeliveryDays}", deliveryDays);
                                        _logger.LogInformation("🎯 Using actual API name: {ActualName}", service.TEN_DICHVU);
                                        
                                        // Get user-friendly name if mapping exists, otherwise use original name
                                        var friendlyName = serviceMapping.ContainsKey(service.MA_DV_CHINH) 
                                            ? serviceMapping[service.MA_DV_CHINH].Name 
                                            : service.TEN_DICHVU;
                                        
                                        shippingOptions.Add(new ShippingOptionDto
                                        {
                                            Provider = ShippingProvider.ViettelPost,
                                            ProviderName = "Viettel Post",
                                            ServiceId = service.MA_DV_CHINH,
                                            ServiceName = friendlyName,
                                            Fee = service.GIA_CUOC,
                                            EstimatedDeliveryDays = deliveryDays,
                                            IsAvailable = true,
                                            ErrorMessage = null
                                        });
                                        }
                                        catch (Exception ex)
                                        {
                                            _logger.LogWarning(ex, "Error processing service {ServiceCode}: {ServiceName}", 
                                                service.MA_DV_CHINH, service.TEN_DICHVU);
                                        }
                                    }
                                }
                                
                                _logger.LogInformation("Returning {Count} main shipping options (filtered from {TotalCount} total)", 
                                    shippingOptions.Count, services.Count);
                                
                                // Log before sorting
                                _logger.LogInformation("🔀 [SORTING DEBUG] Before sorting:");
                                foreach (var option in shippingOptions)
                                {
                                    _logger.LogInformation("  - {ServiceId}: {ServiceName} - {Price} VND - {Days} days", 
                                        option.ServiceId, option.ServiceName, option.Fee, option.EstimatedDeliveryDays);
                                }
                                
                                // Sort by service priority: SHT (hỏa tốc) first, then SCN (nhanh), then STK (tiêu chuẩn)
                                var sortedOptions = shippingOptions.OrderBy(o => o.ServiceId switch
                                {
                                    "SHT" => 1, // Hỏa tốc - nhanh nhất
                                    "SCN" => 2, // Nhanh - nhanh thứ 2
                                    "STK" => 3, // Tiêu chuẩn - chậm nhất
                                    _ => 4
                                }).ToList();
                                
                                // Log after sorting
                                _logger.LogInformation("🔀 [SORTING DEBUG] After sorting:");
                                foreach (var option in sortedOptions)
                                {
                                    _logger.LogInformation("  - {ServiceId}: {ServiceName} - {Price} VND - {Days} days", 
                                        option.ServiceId, option.ServiceName, option.Fee, option.EstimatedDeliveryDays);
                                }
                                
                                return sortedOptions;
                            }
                    }
                    catch (JsonException)
                    {
                        // Try to deserialize as error response
                        try
                        {
                            var errorResponse = JsonSerializer.Deserialize<ViettelPostErrorResponse>(responseContent, options);
                            _logger.LogWarning("Viettel Post API returned error: {Status} - {Message}", 
                                errorResponse?.Status, errorResponse?.Message);
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogError(ex, "Failed to deserialize Viettel Post response: {Response}", responseContent);
                        }
                    }
                }

                // If we reach here, API failed
                if (attempt < maxRetries)
                {
                    _logger.LogWarning("ViettelPost API failed on attempt {Attempt}, retrying in {Delay}ms...", 
                        attempt, retryDelayMs);
                    await Task.Delay(retryDelayMs);
                    continue;
                }
                else
                {
                    _logger.LogError("ViettelPost API failed after {MaxRetries} attempts with status {StatusCode}: {Response}", 
                        maxRetries, response.StatusCode, responseContent);
                    return new List<ShippingOptionDto>();
                }
            }
            catch (Exception ex)
            {
                if (attempt < maxRetries)
                {
                    _logger.LogWarning(ex, "Error on attempt {Attempt}, retrying in {Delay}ms...", 
                        attempt, retryDelayMs);
                    await Task.Delay(retryDelayMs);
                    continue;
                }
                else
                {
                    _logger.LogError(ex, "Error getting Viettel Post shipping options after {MaxRetries} attempts", maxRetries);
                    return new List<ShippingOptionDto>();
                }
            }
            }

            // This should never be reached, but just in case
            return new List<ShippingOptionDto>();
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
                
                _logger.LogInformation("Using Viettel Post token from configuration");
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Viettel Post token");
                throw;
            }
        }

        private async Task<int> GetProvinceIdAsync(string provinceName)
        {
            try
            {
                var provincesResponse = await _addressService.GetProvincesAsync();
                if (provincesResponse.Success && provincesResponse.Data != null)
                {
                    _logger.LogInformation("Searching for province: '{ProvinceName}' in {Count} provinces", 
                        provinceName, provincesResponse.Data.Count);
                    
                    var province = provincesResponse.Data?.FirstOrDefault(p => 
                        p.Name?.ToLower().Contains(provinceName.ToLower()) == true ||
                        provinceName.ToLower().Contains(p.Name?.ToLower() ?? ""));
                    
                    if (province != null)
                    {
                        _logger.LogInformation("✅ Found province: '{ProvinceName}' -> ID: {ProvinceId}", 
                            province.Name, province.Id);
                        return province.Id;
                    }
                    else
                    {
                        _logger.LogWarning("❌ Province not found: '{ProvinceName}'. Available provinces: {AvailableProvinces}", 
                            provinceName, string.Join(", ", provincesResponse.Data?.Select(p => p.Name) ?? new string[0]));
                    }
                }
                
                _logger.LogWarning("Province not found: {ProvinceName}, using default (Binh Dinh)", provinceName);
                return 40; // Default to Binh Dinh (shop location)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting province ID for: {ProvinceName}", provinceName);
                return 40; // Default to Binh Dinh (shop location)
            }
        }

        private async Task<int> GetDistrictIdAsync(string districtName, int provinceId)
        {
            try
            {
                var districtsResponse = await _addressService.GetDistrictsAsync(provinceId);
                if (districtsResponse.Success && districtsResponse.Data != null)
                {
                    _logger.LogInformation("Searching for district: '{DistrictName}' in province {ProvinceId} among {Count} districts", 
                        districtName, provinceId, districtsResponse.Data.Count);
                    
                    var district = districtsResponse.Data?.FirstOrDefault(d => 
                        d.Name?.ToLower().Contains(districtName.ToLower()) == true ||
                        districtName.ToLower().Contains(d.Name?.ToLower() ?? ""));
                    
                    if (district != null)
                    {
                        _logger.LogInformation("✅ Found district: '{DistrictName}' -> ID: {DistrictId}", 
                            district.Name, district.Id);
                        return district.Id;
                    }
                    else
                    {
                        _logger.LogWarning("❌ District not found: '{DistrictName}' in province {ProvinceId}. Available districts: {AvailableDistricts}", 
                            districtName, provinceId, string.Join(", ", districtsResponse.Data?.Select(d => d.Name) ?? new string[0]));
                    }
                }
                
                _logger.LogWarning("District not found: {DistrictName} in province {ProvinceId}, using default (1)", 
                    districtName, provinceId);
                return 1; // Default district
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting district ID for: {DistrictName} in province {ProvinceId}", 
                    districtName, provinceId);
                return 1; // Default district
            }
        }


        private static string GetServiceDisplayName(string serviceCode)
        {
            return serviceCode switch
            {
                "SHT" => "Chuyển phát hỏa tốc",
                "SCN" => "Chuyển phát nhanh", 
                "STK" => "Chuyển phát tiêu chuẩn",
                _ => "Dịch vụ vận chuyển"
            };
        }

        private static int ParseDeliveryTime(string timeString)
        {
            if (string.IsNullOrEmpty(timeString))
                return 3; // Default to 3 days

            // Log the raw time string for debugging
            Console.WriteLine($"[DEBUG] Parsing delivery time: '{timeString}'");

            // Parse strings like "24 giờ", "12 giờ", "36 giờ"
            var match = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)\s*giờ");
            if (match.Success && int.TryParse(match.Groups[1].Value, out var hours))
            {
                // Convert hours to days (round up)
                var days = (int)Math.Ceiling(hours / 24.0);
                Console.WriteLine($"[DEBUG] Converted {hours} hours to {days} days");
                return days;
            }

            // Parse strings like "1 ngày", "2 ngày", "3 ngày"
            var dayMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)\s*ngày");
            if (dayMatch.Success && int.TryParse(dayMatch.Groups[1].Value, out var dayCount))
            {
                Console.WriteLine($"[DEBUG] Found {dayCount} days directly");
                return dayCount;
            }

            // Parse strings like "1.5 ngày", "2.5 ngày" (decimal days)
            var decimalDayMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+\.?\d*)\s*ngày");
            if (decimalDayMatch.Success && double.TryParse(decimalDayMatch.Groups[1].Value, out var decimalDays))
            {
                var roundedDays = (int)Math.Ceiling(decimalDays);
                Console.WriteLine($"[DEBUG] Found {decimalDays} decimal days, rounded to {roundedDays}");
                return roundedDays;
            }

            // Parse strings like "1-2 ngày", "2-3 ngày" (range)
            var rangeMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)-(\d+)\s*ngày");
            if (rangeMatch.Success && int.TryParse(rangeMatch.Groups[1].Value, out var minDays) && int.TryParse(rangeMatch.Groups[2].Value, out var maxDays))
            {
                // Take the average and round up
                var avgDays = (int)Math.Ceiling((minDays + maxDays) / 2.0);
                Console.WriteLine($"[DEBUG] Found range {minDays}-{maxDays} days, using average {avgDays}");
                return avgDays;
            }

            Console.WriteLine($"[DEBUG] Could not parse time string: '{timeString}', using default 3 days");
            return 3; // Default fallback
        }

        private static ShippingStatus MapViettelPostStatus(int viettelStatus)
        {
            return viettelStatus switch
            {
                100 => ShippingStatus.PendingPickup,
                101 => ShippingStatus.Picked,
                102 => ShippingStatus.InTransit,
                200 => ShippingStatus.OutForDelivery,
                300 => ShippingStatus.Delivered,
                400 => ShippingStatus.Failed,
                500 => ShippingStatus.Returning,
                600 => ShippingStatus.Returned,
                700 => ShippingStatus.Cancelled,
                _ => ShippingStatus.PendingPickup
            };
        }

        private static string GetStatusDescription(int status)
        {
            return status switch
            {
                100 => "Chờ lấy hàng",
                101 => "Đã lấy hàng",
                102 => "Đang vận chuyển",
                200 => "Đang giao hàng",
                300 => "Đã giao hàng",
                400 => "Giao hàng thất bại",
                500 => "Đang hoàn trả",
                600 => "Đã hoàn trả",
                700 => "Đã hủy",
                _ => "Không xác định"
            };
        }
    }

    #region Response Models for Viettel Post API
    public class ViettelPostAuthResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostAuthData? Data { get; set; }
    }

    public class ViettelPostAuthData
    {
        public string Token { get; set; } = string.Empty;
    }

    public class ViettelPostPriceResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostPriceData? Data { get; set; }
    }

    public class ViettelPostPriceData
    {
        public decimal MONEY_TOTAL_OLD { get; set; }
        public decimal MONEY_TOTAL { get; set; }
        public decimal MONEY_TOTAL_FEE { get; set; }
        public decimal MONEY_FEE { get; set; }
        public decimal MONEY_COLLECTION_FEE { get; set; }
        public decimal MONEY_OTHER_FEE { get; set; }
        public decimal MONEY_VAS { get; set; }
        public decimal MONEY_VAT { get; set; }
        public decimal KPI_HT { get; set; }
    }

    public class ViettelPostServicesResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostServicesData? Data { get; set; }
    }

    public class ViettelPostServicesData
    {
        public List<ViettelPostService>? ListService { get; set; }
    }

    public class ViettelPostService
    {
        public string SERVICE_CODE { get; set; } = string.Empty;
        public string SERVICE_NAME { get; set; } = string.Empty;
        public string? SERVICE_DESCRIPTION { get; set; }
    }

    public class ViettelPostAddressWarningResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostAddressWarningData? Data { get; set; }
    }

    public class ViettelPostAddressWarningData
    {
        public bool HasWarning { get; set; }
        public string WarningMessage { get; set; } = string.Empty;
    }


    public class ViettelPostCreateOrderResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostCreateOrderData? Data { get; set; }
    }

    public class ViettelPostCreateOrderData
    {
        public string ORDER_NUMBER { get; set; } = string.Empty;
        public decimal MONEY_TOTAL { get; set; }
    }

    public class ViettelPostTrackingResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostTrackingData? Data { get; set; }
    }

    public class ViettelPostTrackingData
    {
        public string ORDER_NUMBER { get; set; } = string.Empty;
        public int ORDER_STATUS { get; set; }
        public string ORDER_DATE { get; set; } = string.Empty;
        public string SENDER_PROVINCE_NAME { get; set; } = string.Empty;
    }

    public class ViettelPostPriceAllResponse
    {
        public string MA_DV_CHINH { get; set; } = string.Empty;
        public string TEN_DICHVU { get; set; } = string.Empty;
        public decimal GIA_CUOC { get; set; }
        public string THOI_GIAN { get; set; } = string.Empty;
        public int EXCHANGE_WEIGHT { get; set; }
        public List<ViettelPostExtraService>? EXTRA_SERVICE { get; set; }
    }

    public class ViettelPostExtraService
    {
        public string SERVICE_CODE { get; set; } = string.Empty;
        public string SERVICE_NAME { get; set; } = string.Empty;
        public string? DESCRIPTION { get; set; }
    }

    public class ViettelPostErrorResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
    }
    #endregion
}
