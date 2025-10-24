using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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
        private readonly IViettelPostAuthService? _authService;
        public ShippingProvider Provider => ShippingProvider.ViettelPost;

        public ViettelPostShippingProvider(
            IOptions<ShippingConfiguration> shippingConfig,
            HttpClient httpClient,
            ILogger<ViettelPostShippingProvider> logger,
            IViettelPostAddressService addressService,
            IViettelPostAuthService? authService = null)
        {
            var config = shippingConfig.Value;
            _config = config.ViettelPost;
            _httpClient = httpClient;
            _logger = logger;
            _addressService = addressService;
            _authService = authService;

            _httpClient.BaseAddress = new Uri(_config.BaseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);
            
            _logger.LogInformation("ViettelPostShippingProvider initialized in Production mode with base URL: {BaseUrl}", 
                _config.BaseUrl);
            
            // Tự động đăng ký kho hàng khi khởi tạo (tạm thời tắt để tránh lỗi)
            // _ = Task.Run(async () => await RegisterDefaultInventoryAsync());
        }

        public async Task<bool> IsAvailableAsync()
        {
            // ✅ Check if enabled
            if (!_config.IsEnabled)
            {
                _logger.LogWarning("⚠️ ViettelPost provider is disabled in configuration");
                return false;
            }

            // ✅ Try to get valid token (will use AuthService if available)
            var token = await GetValidTokenAsync();
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("⚠️ ViettelPost provider: Cannot get valid token");
                return false;
            }

            _logger.LogInformation("✅ ViettelPost provider is available with valid token");
            return true;
        }

        /// <summary>
        /// Get a valid token, refreshing it if necessary
        /// </summary>
        private async Task<string?> GetValidTokenAsync()
        {
            try
            {
                // If we have auth service, use it to get fresh token
                if (_authService != null)
                {
                    var freshToken = await _authService.GetValidTokenAsync();
                    if (!string.IsNullOrEmpty(freshToken))
                    {
                        _accessToken = freshToken;
                        _tokenExpiry = DateTime.UtcNow.AddHours(6); // Assume 6 hours validity
                        _logger.LogInformation("🔄 Using fresh token from auth service");
                        return _accessToken;
                    }
                }

                // If auth service failed or not available, use config token
                if (!string.IsNullOrEmpty(_config.Token))
                {
                    _accessToken = _config.Token;
                    _logger.LogInformation("⚠️ Using static token from config");
                    return _accessToken;
                }

                _logger.LogError("❌ No valid token available");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting valid token");
                return null;
            }
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

                // 🔥 COMPREHENSIVE PRE-VALIDATION 
                var validationResult = await ValidateShippingRequestAsync(request);
                if (!validationResult.IsValid)
                {
                    _logger.LogError("❌ Shipping request validation failed: {Errors}", 
                        string.Join("; ", validationResult.Errors));
                    return new FeeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Yêu cầu tính phí không hợp lệ: {string.Join(", ", validationResult.Errors)}"
                    };
                }

                // Log warnings if any
                if (validationResult.Warnings.Any())
                {
                    _logger.LogWarning("⚠️ Shipping request warnings: {Warnings}", 
                        string.Join(", ", validationResult.Warnings));
                }

                // 🔥 ENHANCED ADDRESS MAPPING WITH STRICT ERROR HANDLING
                var addressMappingResult = await MapAddressesWithValidationAsync(request);
                if (!addressMappingResult.IsValid)
                {
                    _logger.LogError("❌ Address mapping failed: {Error}", addressMappingResult.ErrorMessage);
                    return new FeeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = addressMappingResult.ErrorMessage
                    };
                }

                var (senderProvinceId, senderDistrictId, receiverProvinceId, receiverDistrictId) = addressMappingResult;

                // Log successful mapping
                _logger.LogInformation("📋 Address mapping successful:");
                _logger.LogInformation("  📤 Sender: {FromProvince} -> Province ID {SenderProvinceId}, {FromDistrict} -> District ID {SenderDistrictId}",
                    request.FromAddress.Province, senderProvinceId, request.FromAddress.District, senderDistrictId);
                _logger.LogInformation("  📥 Receiver: {ToProvince} -> Province ID {ReceiverProvinceId}, {ToDistrict} -> District ID {ReceiverDistrictId}",
                    request.ToAddress.Province, receiverProvinceId, request.ToAddress.District, receiverDistrictId);

                var payload = new
                {
                    SENDER_PROVINCE = senderProvinceId,
                    SENDER_DISTRICT = senderDistrictId,
                    RECEIVER_PROVINCE = receiverProvinceId,
                    RECEIVER_DISTRICT = receiverDistrictId,
                    PRODUCT_TYPE = "HH", // Hàng hóa/Goods - có thể mở rộng để hỗ trợ "TH" (Thư/Envelope)
                    PRODUCT_WEIGHT = request.Weight,
                    PRODUCT_PRICE = request.InsuranceValue,
                    MONEY_COLLECTION = (int)request.CodAmount, // NUMBER type theo API documentation
                    TYPE = 1
                };

                _logger.LogInformation("🚀 Sending ViettelPost fee calculation request: {Payload}", 
                    JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));

                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new FeeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await _httpClient.PostAsync("/v2/order/getPrice",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📨 Viettel Post fee calculation response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    
                    // Try to deserialize as single price response
                    try
                    {
                        var priceResponse = JsonSerializer.Deserialize<ViettelPostPriceResponse>(responseContent, options);
                        _logger.LogInformation("Deserialized getPrice result: Status {Status}, Message: {Message}", 
                            priceResponse?.Status, priceResponse?.Message);
                        
                        if (priceResponse != null && priceResponse.Status == 200 && priceResponse.Data != null)
                        {
                            var priceData = priceResponse.Data;
                            
                            _logger.LogInformation("GetPrice successful - Total Fee: {TotalFee}, Money Fee: {MoneyFee}", 
                                priceData.MONEY_TOTAL, priceData.MONEY_FEE);
                            
                            return new FeeResult
                            {
                                IsSuccess = true,
                                Fee = priceData.MONEY_TOTAL,
                                ServiceId = request.ServiceId ?? _config.DefaultServiceId,
                                ServiceName = GetServiceDisplayName(request.ServiceId ?? _config.DefaultServiceId),
                                EstimatedDeliveryDays = GetEstimatedDeliveryDays(request.ServiceId ?? _config.DefaultServiceId),
                                AdditionalData = new Dictionary<string, object>
                                {
                                    ["viettelpost_response"] = priceResponse,
                                    ["price_data"] = priceData,
                                    ["money_total"] = priceData.MONEY_TOTAL,
                                    ["money_fee"] = priceData.MONEY_FEE,
                                    ["money_collection_fee"] = priceData.MONEY_COLLECTION_FEE,
                                    ["money_other_fee"] = priceData.MONEY_OTHER_FEE,
                                    ["money_vas"] = priceData.MONEY_VAS,
                                    ["money_vat"] = priceData.MONEY_VAT
                                }
                            };
                        }
                        else
                        {
                            _logger.LogWarning("GetPrice API returned unsuccessful status: {Status} - {Message}", 
                                priceResponse?.Status, priceResponse?.Message);
                            
                            return new FeeResult
                            {
                                IsSuccess = false,
                                ErrorMessage = priceResponse?.Message ?? "Viettel Post API error"
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
                            
                            // Xử lý các error status theo API documentation
                            string errorMessage = errorResponse?.Status switch
                            {
                                204 => "Price does not apply to this itinerary!",
                                205 => "System error",
                                _ => errorResponse?.Message ?? "Viettel Post API error"
                            };
                            
                            return new FeeResult
                            {
                                IsSuccess = false,
                                ErrorMessage = errorMessage
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
                _logger.LogInformation("🚀 Creating ViettelPost shipment for order {OrderNumber}", order.OrderNumber);

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
                    GROUPADDRESS_ID = _config.DefaultPickupAddress.GroupAddressId ?? 0,
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
                    PRODUCT_TYPE = _config.BusinessRules.ProductTypes.Default, // Configurable: HH (Hàng hóa) hoặc TH (Thư)
                    ORDER_PAYMENT = order.PaymentMethod == PaymentMethod.CashOnDelivery ? 
                        _config.BusinessRules.PaymentMethods.CashOnDelivery : 
                        _config.BusinessRules.PaymentMethods.SenderPay, // Configurable payment methods
                    ORDER_SERVICE = _config.BusinessRules.ServiceTypes.Default, // Configurable: VCN, VHT, etc.
                    ORDER_SERVICE_ADD = "",
                    ORDER_VOUCHER = "",
                    ORDER_NOTE = shippingRequest.Note ?? "",
                    MONEY_COLLECTION = order.PaymentMethod == PaymentMethod.CashOnDelivery ? (int)shippingRequest.CodAmount : 0,
                    MONEY_TOTALFEE = (int)shippingRequest.Fee,
                    MONEY_FEECOD = 0, // Có thể tính toán dựa trên CodAmount
                    MONEY_FEEVAS = 0, // Có thể mở rộng thêm field này trong tương lai
                    MONEY_FEEINSURRANCE = (int)shippingRequest.InsuranceValue,
                    MONEY_FEE = (int)shippingRequest.Fee,
                    MONEY_FEEOTHER = 0, // Có thể mở rộng thêm field này trong tương lai
                    MONEY_TOTALVAT = 0, // Có thể mở rộng thêm field này trong tương lai
                    MONEY_TOTAL = (int)shippingRequest.Fee,
                    CHECK_UNIQUE = true, // Check trùng mã đơn hàng
                    EXTRA_MONEY = 0, // Tiền thu khi cho khách xem hàng nhưng không lấy (dùng với dịch vụ XMG)
                    LIST_ITEM = listItems
                };

                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new CreateShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await _httpClient.PostAsync("/v2/order/createOrder",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Viettel Post create shipment response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostCreateOrderResponse>(responseContent);
                    
                    if (result?.Status == 200 && result.Data != null)
                    {
                        // Sử dụng dữ liệu từ API response thay vì hard code
                        var createData = result.Data;
                        var trackingCode = createData.ORDER_NUMBER;

                        return new CreateShipmentResult
                        {
                            IsSuccess = true,
                            TrackingCode = trackingCode,
                            ExternalId = createData.ORDER_NUMBER,
                            TotalFee = createData.MONEY_TOTAL,
                            AdditionalData = new Dictionary<string, object>
                            {
                                ["viettelpost_response"] = result,
                                ["order_number"] = createData.ORDER_NUMBER,
                                ["money_collection"] = createData.MONEY_COLLECTTION,
                                ["exchange_weight"] = createData.EXCHANGE_WEIGHT,
                                ["money_other_fee"] = createData.MONEY_OTHER_FEE,
                                ["money_fee"] = createData.MONEY_FEE,
                                ["money_collection_fee"] = createData.MONEY_COLLECTION_FEE,
                                ["money_fee_vat"] = createData.MONEY_FEE_VAT,
                                ["money_total_fee"] = createData.MONEY_TOTAL_FEE,
                                ["money_total"] = createData.MONEY_TOTAL,
                                ["is_production"] = true
                            }
                        };
                    }
                }

                // Xử lý error response với các status code cụ thể
                try
                {
                    var errorResult = JsonSerializer.Deserialize<ViettelPostCreateOrderResponse>(responseContent);
                    if (errorResult != null)
                    {
                        string errorMessage = errorResult.Status switch
                        {
                            201 => "Cancel key in delivery note!",
                            202 => "Token error (blank, expired ...)",
                            203 => "Field error may not be blank (order status, ....)",
                            204 => "Invalid data error",
                            205 => "System error",
                            206 => "Order status already exists on the system",
                            _ => errorResult.Message ?? "Viettel Post API error"
                        };

                        _logger.LogError("Viettel Post createOrder API returned error {Status}: {Message} for order {OrderNumber}", 
                            errorResult.Status, errorMessage, order.OrderNumber);

                        return new CreateShipmentResult
                        {
                            IsSuccess = false,
                            ErrorMessage = errorMessage
                        };
                    }
                }
                catch (JsonException)
                {
                    // Fallback nếu không parse được JSON
                }

                // Log error and return failure
                _logger.LogError("Viettel Post API returned error for order {OrderNumber}: {Response}", order.OrderNumber, responseContent);

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
                _logger.LogInformation("Cancelling ViettelPost shipment {TrackingCode}", trackingCode);
                
                // Use UpdateOrderStatusAsync with TYPE=4 (Cancel order)
                var result = await UpdateOrderStatusAsync(trackingCode, 4, reason);
                
                return new CancelShipmentResult
                {
                    IsSuccess = result.IsSuccess,
                    ErrorMessage = result.ErrorMessage,
                    CancelReason = reason
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling ViettelPost shipment {TrackingCode}", trackingCode);
                return new CancelShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// Edit order information - Uses /v2/order/edit API
        /// Only works when ORDER_STATUS < 200
        /// </summary>
        public async Task<UpdateOrderResult> EditOrderInfoAsync(Order order, ShippingRequest shippingRequest)
        {
            try
            {
                _logger.LogInformation("Editing order info in ViettelPost for order {OrderNumber}", order.OrderNumber);
                var fromAddress = JsonSerializer.Deserialize<ShippingAddressDto>(shippingRequest.FromAddress);
                var toAddress = JsonSerializer.Deserialize<ShippingAddressDto>(shippingRequest.ToAddress);
                
                // Validate required address IDs
                if (toAddress?.WardId == null || toAddress?.DistrictId == null || toAddress?.ProvinceId == null)
                {
                    throw new InvalidOperationException("Complete receiver address information (ProvinceId, DistrictId, WardId) is required for editing order");
                }
                
                if (fromAddress?.WardId == null || fromAddress?.DistrictId == null || fromAddress?.ProvinceId == null)
                {
                    throw new InvalidOperationException("Complete sender address information (ProvinceId, DistrictId, WardId) is required for editing order");
                }

                // Calculate total weight and price
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

                // Payload theo ViettelPost /v2/order/edit API - GIỐNG HỆT CreateOrder
                var payload = new
                {
                    ORDER_NUMBER = order.OrderNumber,
                    GROUPADDRESS_ID = "",
                    CUS_ID = "",
                    DELIVERY_DATE = order.ShippedAt?.ToString("dd/MM/yyyy HH:mm:ss") ?? DateTime.Now.AddDays(1).ToString("dd/MM/yyyy HH:mm:ss"),
                    SENDER_FULLNAME = fromAddress?.Name ?? _config.DefaultPickupAddress.Name,
                    SENDER_ADDRESS = fromAddress?.AddressDetail ?? _config.DefaultPickupAddress.AddressDetail,
                    SENDER_PHONE = fromAddress?.Phone ?? _config.DefaultPickupAddress.Phone,
                    SENDER_EMAIL = "",
                    SENDER_WARD = fromAddress?.WardId ?? _config.DefaultPickupAddress.WardId,
                    SENDER_DISTRICT = fromAddress?.DistrictId ?? _config.DefaultPickupAddress.DistrictId,
                    SENDER_PROVINCE = fromAddress?.ProvinceId ?? _config.DefaultPickupAddress.ProvinceId,
                    RECEIVER_FULLNAME = toAddress?.Name ?? throw new InvalidOperationException("Receiver name is required"),
                    RECEIVER_ADDRESS = toAddress?.AddressDetail ?? throw new InvalidOperationException("Receiver address is required"),
                    RECEIVER_PHONE = toAddress?.Phone ?? throw new InvalidOperationException("Receiver phone is required"),
                    RECEIVER_EMAIL = "",
                    RECEIVER_WARD = toAddress?.WardId ?? throw new InvalidOperationException("Receiver ward ID is required"),
                    RECEIVER_DISTRICT = toAddress?.DistrictId ?? throw new InvalidOperationException("Receiver district ID is required"),
                    RECEIVER_PROVINCE = toAddress?.ProvinceId ?? throw new InvalidOperationException("Receiver province ID is required"),
                    PRODUCT_NAME = $"Đơn hàng {order.OrderNumber}",
                    PRODUCT_QUANTITY = order.Items.Sum(i => i.Quantity),
                    PRODUCT_PRICE = (int)totalPrice,
                    PRODUCT_WEIGHT = (int)totalWeight,
                    PRODUCT_LENGTH = 0,
                    PRODUCT_WIDTH = 0,
                    PRODUCT_HEIGHT = 0,
                    PRODUCT_TYPE = "HH",
                    ORDER_PAYMENT = order.PaymentMethod == PaymentMethod.CashOnDelivery ? 3 : 1,
                    ORDER_SERVICE = shippingRequest.ServiceId ?? "VCN",
                    ORDER_SERVICE_ADD = "",
                    ORDER_VOUCHER = "",
                    ORDER_NOTE = shippingRequest.Note ?? order.Notes ?? "",
                    MONEY_COLLECTION = order.PaymentMethod == PaymentMethod.CashOnDelivery ? (int)shippingRequest.CodAmount : 0,
                    EXTRA_MONEY = 0,
                    CHECK_UNIQUE = true,
                    LIST_ITEM = listItems
                };

                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await _httpClient.PostAsync("/v2/order/edit",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("ViettelPost /v2/order/edit response for {OrderNumber}: {Response}", 
                    order.OrderNumber, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostCreateOrderResponse>(responseContent);
                    
                    if (result?.Status == 200 && result.Data != null)
                    {
                        _logger.LogInformation("✅ Order {OrderNumber} edited successfully in ViettelPost", order.OrderNumber);
                        
                        return new UpdateOrderResult
                        {
                            IsSuccess = true,
                            Message = "Cập nhật thông tin đơn hàng thành công",
                            AdditionalData = new Dictionary<string, object>
                            {
                                ["order_number"] = result.Data.ORDER_NUMBER,
                                ["money_total"] = result.Data.MONEY_TOTAL,
                                ["money_total_fee"] = result.Data.MONEY_TOTAL_FEE
                            }
                        };
                    }
                }

                var errorResult = JsonSerializer.Deserialize<ViettelPostCreateOrderResponse>(responseContent);
                string errorMessage = errorResult?.Status switch
                {
                    203 => "Đơn hàng không tồn tại hoặc trạng thái đã thay đổi (ORDER_STATUS >= 200, không thể sửa)",
                    _ => errorResult?.Message ?? "Lỗi khi cập nhật đơn hàng"
                };

                _logger.LogError("ViettelPost /v2/order/edit error {Status}: {Message} for {OrderNumber}", 
                    errorResult?.Status, errorMessage, order.OrderNumber);

                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = errorMessage
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing ViettelPost order {OrderNumber}", order.OrderNumber);
                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// Update order status - Uses /v2/order/UpdateOrder API
        /// TYPE: 1=Approve, 2=Approve Return, 3=Re-deliver, 4=Cancel, 11=Delete
        /// </summary>
        public async Task<UpdateOrderResult> UpdateOrderStatusAsync(string trackingCode, int updateType, string note)
        {
            try
            {
                _logger.LogInformation("Updating ViettelPost order status for {TrackingCode}, Type={Type}", trackingCode, updateType);
                
                // Validate
                if (string.IsNullOrEmpty(trackingCode))
                    throw new ArgumentException("Tracking code is required", nameof(trackingCode));
                
                if (note?.Length > 150)
                    throw new ArgumentException("Note cannot exceed 150 characters", nameof(note));

                var payload = new
                {
                    TYPE = updateType,
                    ORDER_NUMBER = trackingCode,
                    NOTE = note ?? ""
                };

                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await _httpClient.PostAsync("/v2/order/UpdateOrder",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("ViettelPost /v2/order/UpdateOrder response for {TrackingCode}: {Response}", 
                    trackingCode, responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostUpdateOrderStatusResponse>(responseContent);
                    
                    if (result?.Status == 200)
                    {
                        string actionName = updateType switch
                        {
                            1 => "duyệt đơn hàng",
                            2 => "duyệt hoàn",
                            3 => "phát tiếp",
                            4 => "hủy đơn hàng",
                            11 => "xóa đơn hàng đã hủy",
                            _ => "cập nhật"
                        };
                        
                        _logger.LogInformation("✅ {Action} thành công cho đơn {TrackingCode}", actionName, trackingCode);
                        
                        return new UpdateOrderResult
                        {
                            IsSuccess = true,
                            Message = result.Message ?? $"Cập nhật trạng thái thành công: {actionName}"
                        };
                    }
                }

                var errorResult = JsonSerializer.Deserialize<ViettelPostUpdateOrderStatusResponse>(responseContent);
                _logger.LogError("ViettelPost /v2/order/UpdateOrder error {Status}: {Message} for {TrackingCode}", 
                    errorResult?.Status, errorResult?.Message, trackingCode);

                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = errorResult?.Message ?? "Lỗi khi cập nhật trạng thái đơn hàng"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ViettelPost order status for {TrackingCode}", trackingCode);
                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        /// <summary>
        /// Legacy method - redirects to EditOrderInfoAsync
        /// </summary>
        [Obsolete("Use EditOrderInfoAsync for editing order info or UpdateOrderStatusAsync for status changes")]
        public async Task<UpdateOrderResult> UpdateOrderAsync(Order order, ShippingRequest shippingRequest)
        {
            return await EditOrderInfoAsync(order, shippingRequest);
        }

        public async Task<TrackingResult> GetTrackingAsync(string trackingCode)
        {
            try
            {
                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new TrackingResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

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
                _logger.LogInformation("Processing ViettelPost webhook data: {WebhookData}", webhookData);
                
                var webhookPayload = JsonSerializer.Deserialize<DTOs.ViettelPostWebhookData>(webhookData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (webhookPayload?.DATA == null)
                {
                    _logger.LogWarning("Webhook payload or DATA is null");
                    return Task.FromResult<ShippingWebhookDto?>(null);
                }

                // Validate required fields
                if (string.IsNullOrEmpty(webhookPayload.DATA.ORDER_NUMBER))
                {
                    _logger.LogWarning("ORDER_NUMBER is missing in webhook data");
                    return Task.FromResult<ShippingWebhookDto?>(null);
                }

                // Parse status date
                DateTime statusDate;
                if (!DateTime.TryParseExact(webhookPayload.DATA.ORDER_STATUSDATE, "dd/MM/yyyy H:m:s", 
                    System.Globalization.CultureInfo.InvariantCulture, 
                    System.Globalization.DateTimeStyles.None, out statusDate))
                {
                    _logger.LogWarning("Invalid ORDER_STATUSDATE format: {StatusDate}", webhookPayload.DATA.ORDER_STATUSDATE);
                    statusDate = DateTime.UtcNow;
                }

                // Map status to description
                var statusDescription = GetViettelPostStatusDescription(webhookPayload.DATA.ORDER_STATUS);

                _logger.LogInformation("Processed webhook for order {OrderNumber} with status {Status} ({StatusDescription})", 
                    webhookPayload.DATA.ORDER_NUMBER, webhookPayload.DATA.ORDER_STATUS, statusDescription);

                return Task.FromResult<ShippingWebhookDto?>(new ShippingWebhookDto
                {
                    TrackingCode = webhookPayload.DATA.ORDER_NUMBER,
                    Status = webhookPayload.DATA.ORDER_STATUS.ToString(),
                    Timestamp = statusDate,
                    Description = statusDescription,
                    Location = webhookPayload.DATA.NOTE ?? "Unknown",
                    RawData = new Dictionary<string, object>
                    {
                        ["ORDER_REFERENCE"] = webhookPayload.DATA.ORDER_REFERENCE ?? "",
                        ["ORDER_STATUSDATE"] = webhookPayload.DATA.ORDER_STATUSDATE ?? "",
                        ["ORDER_STATUS"] = webhookPayload.DATA.ORDER_STATUS,
                        ["NOTE"] = webhookPayload.DATA.NOTE ?? "",
                        ["MONEY_COLLECTION"] = webhookPayload.DATA.MONEY_COLLECTION,
                        ["MONEY_TOTAL"] = webhookPayload.DATA.MONEY_TOTAL,
                        ["EXPECTED_DELIVERY"] = webhookPayload.DATA.EXPECTED_DELIVERY ?? "",
                        ["PRODUCT_WEIGHT"] = webhookPayload.DATA.PRODUCT_WEIGHT,
                        ["ORDER_SERVICE"] = webhookPayload.DATA.ORDER_SERVICE ?? ""
                    }
                });
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
                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogError("❌ Cannot get valid token for ViettelPost API");
                    return new List<ShippingServiceDto>();
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                // Gọi API listService với TYPE = 2
                var requestBody = new { TYPE = 2 };
                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync("/v2/categories/listService", content);
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
                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new AddressWarningResult
                    {
                        HasWarning = true,
                        WarningMessage = "Không thể lấy token hợp lệ cho ViettelPost API",
                        IsValid = false
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

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
            var maxRetries = _config.BusinessRules.MaxRetryAttempts;
            var retryDelayMs = _config.BusinessRules.RetryDelayMs;

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
                var senderWardId = request.FromAddress.WardId ?? 0; // ⚠️ Ward may be optional for getPriceAll
                
                var receiverProvinceId = request.ToAddress.ProvinceId ?? await GetProvinceIdAsync(request.ToAddress.Province);
                var receiverDistrictId = request.ToAddress.DistrictId ?? await GetDistrictIdAsync(request.ToAddress.District, receiverProvinceId);
                var receiverWardId = request.ToAddress.WardId ?? 0; // ⚠️ Ward may be optional for getPriceAll

                _logger.LogInformation("=== ADDRESS MAPPING DEBUG ===");
                _logger.LogInformation("FROM: {FromProvince} -> ID: {FromProvinceId}, {FromDistrict} -> ID: {FromDistrictId}, Ward ID: {FromWardId}", 
                    request.FromAddress.Province, senderProvinceId, request.FromAddress.District, senderDistrictId, senderWardId);
                _logger.LogInformation("TO: {ToProvince} -> ID: {ToProvinceId}, {ToDistrict} -> ID: {ToDistrictId}, Ward ID: {ToWardId}", 
                    request.ToAddress.Province, receiverProvinceId, request.ToAddress.District, receiverDistrictId, receiverWardId);
                _logger.LogInformation("🏠 FROM ADDRESS: {FromAddress}", 
                    $"{request.FromAddress.AddressDetail}, {request.FromAddress.Ward}, {request.FromAddress.District}, {request.FromAddress.Province}");
                _logger.LogInformation("📦 TO ADDRESS: {ToAddress}", 
                    $"{request.ToAddress.AddressDetail}, {request.ToAddress.Ward}, {request.ToAddress.District}, {request.ToAddress.Province}");
                _logger.LogInformation("=== END ADDRESS MAPPING ===");

                var payload = new
                {
                    SENDER_PROVINCE = senderProvinceId,
                    SENDER_DISTRICT = senderDistrictId,
                    SENDER_WARD = senderWardId, // ✅ ADDED
                    RECEIVER_PROVINCE = receiverProvinceId,
                    RECEIVER_DISTRICT = receiverDistrictId,
                    RECEIVER_WARD = receiverWardId, // ✅ ADDED
                    PRODUCT_TYPE = "HH", // Hàng hóa/Goods - có thể mở rộng để hỗ trợ "TH" (Thư/Envelope)
                    PRODUCT_WEIGHT = request.Weight,
                    PRODUCT_PRICE = request.InsuranceValue,
                    MONEY_COLLECTION = (int)request.CodAmount, // NUMBER type theo API documentation
                    TYPE = 1
                };
                
                _logger.LogInformation("📤 [API REQUEST] ViettelPost getPriceAll payload:");
                _logger.LogInformation("  🏠 From: Province {FromProvinceId}, District {FromDistrictId}, Ward {FromWardId}", 
                    senderProvinceId, senderDistrictId, senderWardId);
                _logger.LogInformation("  📦 To: Province {ToProvinceId}, District {ToDistrictId}, Ward {ToWardId}", 
                    receiverProvinceId, receiverDistrictId, receiverWardId);
                _logger.LogInformation("  ⚖️ Weight: {Weight}g, Price: {Price} VND, COD: {CodAmount} VND", 
                    request.Weight, request.InsuranceValue, request.CodAmount);
                _logger.LogInformation("  📋 Full JSON payload: {Payload}", JsonSerializer.Serialize(payload));
                
                // ⚠️ WARNING: Ward ID = 0 means missing ward data, may affect pricing
                if (senderWardId == 0)
                {
                    _logger.LogWarning("⚠️ SENDER_WARD = 0 (missing ward data) - this may affect shipping cost calculation!");
                }
                if (receiverWardId == 0)
                {
                    _logger.LogWarning("⚠️ RECEIVER_WARD = 0 (missing ward data) - this may affect shipping cost calculation!");
                }
                
                // Check if it's intra-province delivery
                var isIntraProvince = senderProvinceId == receiverProvinceId;
                _logger.LogInformation("🚚 Delivery type: {DeliveryType} (Same province: {IsIntraProvince})", 
                    isIntraProvince ? "Nội tỉnh" : "Liên tỉnh", isIntraProvince);

                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new List<ShippingOptionDto>();
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                // ✅ NEW: Use getPriceAll API instead of getPrice
                var response = await _httpClient.PostAsync("/v2/order/getPriceAll",
                    new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("📦 ViettelPost getPriceAll response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    
                    try
                    {
                        // ✅ NEW: Parse getPriceAll response (returns array of services)
                        var priceAllResponse = JsonSerializer.Deserialize<List<ViettelPostPriceAllResponse>>(responseContent, options);
                        
                        if (priceAllResponse != null && priceAllResponse.Count > 0)
                        {
                            var shippingOptions = new List<ShippingOptionDto>();
                            
                            _logger.LogInformation("✅ GetPriceAll successful - Found {ServiceCount} services", priceAllResponse.Count);
                            
                            // ✅ Filter to only show 3 main services: Economy, Standard, Express
                            var mainServiceCodes = new[] { "STK", "SCN", "SHT" }; // Tiêu chuẩn, Nhanh, Hỏa tốc
                            var filteredServices = priceAllResponse
                                .Where(s => mainServiceCodes.Contains(s.MA_DV_CHINH))
                                .ToList();
                            
                            _logger.LogInformation("🎯 Filtered to {FilteredCount} main services (STK, SCN, SHT)", filteredServices.Count);
                            
                            foreach (var service in filteredServices)
                            {
                                var deliveryDays = ParseDeliveryTime(service.THOI_GIAN ?? "3 ngày");
                                
                                // Ensure minimum delivery time is 1 day
                                if (deliveryDays <= 0)
                                {
                                    deliveryDays = 3; // Default to 3 days
                                    _logger.LogWarning("🚨 [GetShippingOptionsAsync] Invalid delivery days ({DeliveryDays}), defaulting to 3 days", deliveryDays);
                                }
                                
                                _logger.LogInformation("🔍 [GetShippingOptionsAsync] Service data: MA_DV_CHINH={ServiceCode}, TEN_DICHVU={ServiceName}, GIA_CUOC={Fee}, THOI_GIAN='{TimeString}' → {DeliveryDays} days", 
                                    service.MA_DV_CHINH, service.TEN_DICHVU, service.GIA_CUOC, service.THOI_GIAN ?? "NULL", deliveryDays);
                                
                                var option = new ShippingOptionDto
                                {
                                    Provider = ShippingProvider.ViettelPost,
                                    ProviderName = "Viettel Post",
                                    ServiceId = service.MA_DV_CHINH,
                                    ServiceName = service.TEN_DICHVU,
                                    Fee = service.GIA_CUOC,
                                    EstimatedDeliveryDays = deliveryDays,
                                    IsAvailable = true,
                                    ErrorMessage = null
                                };
                                
                                shippingOptions.Add(option);
                                
                                _logger.LogInformation("🚚 Service: {ServiceCode} - {ServiceName} | Fee: {Fee:C} | Time: {DeliveryTime} ({DeliveryDays} days)", 
                                    service.MA_DV_CHINH, service.TEN_DICHVU, service.GIA_CUOC, service.THOI_GIAN, deliveryDays);
                            }
                            
                            // Sort by delivery speed (fastest first)
                            shippingOptions = shippingOptions.OrderBy(s => s.EstimatedDeliveryDays).ThenBy(s => s.Fee).ToList();
                            
                            _logger.LogInformation("💰 Returning {OptionsCount} shipping options, fastest: {FastestService} ({FastestDays} days, {FastestFee:C})", 
                                shippingOptions.Count, 
                                shippingOptions.FirstOrDefault()?.ServiceName,
                                shippingOptions.FirstOrDefault()?.EstimatedDeliveryDays ?? 0,
                                shippingOptions.FirstOrDefault()?.Fee ?? 0);
                            
                            return shippingOptions;
                        }
                        else
                        {
                            _logger.LogWarning("GetPriceAll API returned empty array or null");
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Failed to deserialize ViettelPost getPriceAll response: {Response}", responseContent);
                        
                        // Try to parse as error response
                        try
                        {
                            var errorResponse = JsonSerializer.Deserialize<ViettelPostErrorResponse>(responseContent, options);
                            _logger.LogWarning("ViettelPost getPriceAll API returned error: {Status} - {Message}", 
                                errorResponse?.Status, errorResponse?.Message);
                        }
                        catch (JsonException)
                        {
                            _logger.LogError("Cannot parse response as error either");
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

        public async Task<ListInventoryResult> ListInventoryAsync()
        {
            try
            {
                // Get valid token before making API call
                var token = await GetValidTokenAsync();
                if (string.IsNullOrEmpty(token))
                {
                    return new ListInventoryResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API"
                    };
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Token", token);

                var response = await _httpClient.GetAsync("/v2/user/listInventory");
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Viettel Post listInventory response: {Response}", responseContent);

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
                            Message = "Lấy danh sách kho hàng thành công",
                            Inventories = inventories
                        };
                    }
                    else
                    {
                        // Xử lý các error status theo API documentation
                        string errorMessage = result?.Status switch
                        {
                            201 => "Account have logged in on another machine! - Tài khoản đã đăng nhập trên thiết bị khác",
                            202 => "Correct delivery note - Phiếu giao hàng chính xác", 
                            205 => "System error - Lỗi hệ thống ViettelPost",
                            _ => result?.Message ?? "Không thể lấy danh sách kho hàng"
                        };
                        
                        _logger.LogWarning("ViettelPost listInventory API error: Status={Status}, Error={Error}, Message={Message}", 
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
                    ErrorMessage = $"Viettel Post API error: {responseContent}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting inventory list from Viettel Post");
                return new ListInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        // Private helper methods

        private async Task EnsureAuthenticatedAsync()
        {
            // Try using AuthService first if available
            if (_authService != null)
            {
                try
                {
                    _accessToken = await _authService.GetValidTokenAsync();
                    _tokenExpiry = DateTime.UtcNow.AddHours(23); // Conservative expiry
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AuthService failed, falling back to static token");
                }
            }

            // Fallback to original logic
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
                    
                    // Prioritize exact match first
                    var exactMatch = provincesResponse.Data?.FirstOrDefault(p => 
                        string.Equals(p.Name, provinceName, StringComparison.OrdinalIgnoreCase));
                    
                    if (exactMatch != null)
                    {
                        _logger.LogInformation("✅ Exact match found: '{ProvinceName}' -> '{ViettelName}' (ID: {ProvinceId})", 
                            provinceName, exactMatch.Name, exactMatch.Id);
                        return exactMatch.Id;
                    }
                    
                    // Try common mappings for major cities
                    var normalizedName = provinceName.ToLower().Trim();
                    switch (normalizedName)
                    {
                        case "hồ chí minh":
                        case "tp hồ chí minh":
                        case "tp.hồ chí minh":
                        case "thành phố hồ chí minh":
                            var hcm = provincesResponse.Data?.FirstOrDefault(p => 
                                p.Name?.ToLower().Contains("hồ chí minh") == true);
                            if (hcm != null) return hcm.Id;
                            break;
                            
                        case "hà nội":
                        case "tp hà nội":
                        case "thành phố hà nội":
                            var hanoi = provincesResponse.Data?.FirstOrDefault(p => 
                                p.Name?.ToLower().Contains("hà nội") == true);
                            if (hanoi != null) return hanoi.Id;
                            break;
                            
                        case "đà nẵng":
                        case "tp đà nẵng":
                        case "thành phố đà nẵng":
                            var danang = provincesResponse.Data?.FirstOrDefault(p => 
                                p.Name?.ToLower().Contains("đà nẵng") == true);
                            if (danang != null) return danang.Id;
                            break;
                            
                        case "cần thơ":
                        case "tp cần thơ":
                        case "thành phố cần thơ":
                            var cantho = provincesResponse.Data?.FirstOrDefault(p => 
                                p.Name?.ToLower().Contains("cần thơ") == true);
                            if (cantho != null) return cantho.Id;
                            break;
                            
                        case "hải phòng":
                        case "tp hải phòng":
                        case "thành phố hải phòng":
                            var haiphong = provincesResponse.Data?.FirstOrDefault(p => 
                                p.Name?.ToLower().Contains("hải phòng") == true);
                            if (haiphong != null) return haiphong.Id;
                            break;
                    }
                    
                    // Fallback to contains matching (less accurate)
                    var containsMatch = provincesResponse.Data?.FirstOrDefault(p => 
                        p.Name?.ToLower().Contains(provinceName.ToLower()) == true ||
                        provinceName.ToLower().Contains(p.Name?.ToLower() ?? ""));
                    
                    if (containsMatch != null)
                    {
                        _logger.LogWarning("⚠️ Using fuzzy match: '{ProvinceName}' -> '{ViettelName}' (ID: {ProvinceId})", 
                            provinceName, containsMatch.Name, containsMatch.Id);
                        return containsMatch.Id;
                    }
                    else
                    {
                        _logger.LogError("❌ Province not found: '{ProvinceName}'. Available provinces: {AvailableProvinces}", 
                            provinceName, string.Join(", ", provincesResponse.Data?.Select(p => p.Name) ?? new string[0]));
                    }
                }
                
                _logger.LogWarning("Province not found: {ProvinceName}, this will cause shipping calculation to fail", provinceName);
                return -1; // Return invalid ID to indicate error
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting province ID for: {ProvinceName}", provinceName);
                return -1; // Return invalid ID to indicate error
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
                    
                    // Prioritize exact match first
                    var exactMatch = districtsResponse.Data?.FirstOrDefault(d => 
                        string.Equals(d.Name, districtName, StringComparison.OrdinalIgnoreCase));
                    
                    if (exactMatch != null)
                    {
                        _logger.LogInformation("✅ Exact district match: '{DistrictName}' -> '{ViettelName}' (ID: {DistrictId})", 
                            districtName, exactMatch.Name, exactMatch.Id);
                        return exactMatch.Id;
                    }
                    
                    // Try normalized district names
                    var normalizedName = districtName.ToLower().Trim()
                        .Replace("quận ", "")
                        .Replace("huyện ", "")
                        .Replace("thành phố ", "")
                        .Replace("thị xã ", "")
                        .Replace("tp ", "")
                        .Replace("q.", "")
                        .Replace("h.", "");
                    
                    var normalizedMatch = districtsResponse.Data?.FirstOrDefault(d => {
                        var viettelNormalized = d.Name?.ToLower()
                            .Replace("quận ", "")
                            .Replace("huyện ", "")
                            .Replace("thành phố ", "")
                            .Replace("thị xã ", "")
                            .Replace("tp ", "")
                            .Replace("q.", "")
                            .Replace("h.", "");
                        return string.Equals(viettelNormalized, normalizedName, StringComparison.OrdinalIgnoreCase);
                    });
                    
                    if (normalizedMatch != null)
                    {
                        _logger.LogInformation("✅ Normalized district match: '{DistrictName}' -> '{ViettelName}' (ID: {DistrictId})", 
                            districtName, normalizedMatch.Name, normalizedMatch.Id);
                        return normalizedMatch.Id;
                    }
                    
                    // Fallback to contains matching
                    var containsMatch = districtsResponse.Data?.FirstOrDefault(d => 
                        d.Name?.ToLower().Contains(districtName.ToLower()) == true ||
                        districtName.ToLower().Contains(d.Name?.ToLower() ?? ""));
                    
                    if (containsMatch != null)
                    {
                        _logger.LogWarning("⚠️ Using fuzzy district match: '{DistrictName}' -> '{ViettelName}' (ID: {DistrictId})", 
                            districtName, containsMatch.Name, containsMatch.Id);
                        return containsMatch.Id;
                    }
                    else
                    {
                        _logger.LogError("❌ District not found: '{DistrictName}' in province {ProvinceId}. Available districts: {AvailableDistricts}", 
                            districtName, provinceId, string.Join(", ", districtsResponse.Data?.Select(d => d.Name) ?? new string[0]));
                    }
                }
                
                _logger.LogWarning("District not found: {DistrictName} in province {ProvinceId}, this will cause shipping calculation to fail", 
                    districtName, provinceId);
                return -1; // Return invalid ID to indicate error
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting district ID for: {DistrictName} in province {ProvinceId}", 
                    districtName, provinceId);
                return -1; // Return invalid ID to indicate error
            }
        }


        /// <summary>
        /// 🔥 Get service display name from configuration to avoid hard-coding
        /// </summary>
        private string GetServiceDisplayName(string serviceCode)
        {
            if (_config.BusinessRules.ServiceTypes.DisplayNames.TryGetValue(serviceCode, out var displayName))
            {
                return displayName;
            }
            
            // Fallback for unknown service types
            return $"Viettel Post {serviceCode}";
        }

        /// <summary>
        /// 🔥 Get estimated delivery days from configuration to avoid hard-coding
        /// </summary>
        private int GetEstimatedDeliveryDays(string serviceId)
        {
            if (_config.BusinessRules.ServiceTypes.EstimatedDeliveryDays.TryGetValue(serviceId, out var days))
            {
                return days;
            }
            
            // Fallback for unknown service types (default to standard delivery)
            return 3;
        }

        private int ParseDeliveryTime(string timeString)
        {
            if (string.IsNullOrEmpty(timeString))
            {
                _logger.LogWarning("[ParseDeliveryTime] Empty or null time string provided. Defaulting to 3 days.");
                return 3; // Default to 3 days
            }

            _logger.LogInformation("[ParseDeliveryTime] Parsing delivery time: '{TimeString}'", timeString);

            // Parse strings like "24 giờ", "12 giờ", "36 giờ"
            var match = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)\s*giờ");
            if (match.Success && int.TryParse(match.Groups[1].Value, out var hours))
            {
                var days = (int)Math.Ceiling(hours / 24.0);
                _logger.LogInformation("[ParseDeliveryTime] Converted {Hours} hours to {Days} days", hours, days);
                return days;
            }

            // Parse strings like "1 ngày", "2 ngày", "3 ngày"
            var dayMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)\s*ngày");
            if (dayMatch.Success && int.TryParse(dayMatch.Groups[1].Value, out var dayCount))
            {
                _logger.LogInformation("[ParseDeliveryTime] Found {DayCount} days directly", dayCount);
                return dayCount;
            }

            // Parse strings like "1.5 ngày", "2.5 ngày" (decimal days)
            var decimalDayMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+\.?\d*)\s*ngày");
            if (decimalDayMatch.Success && double.TryParse(decimalDayMatch.Groups[1].Value, out var decimalDays))
            {
                var roundedDays = (int)Math.Ceiling(decimalDays);
                _logger.LogInformation("[ParseDeliveryTime] Found {DecimalDays} decimal days, rounded to {RoundedDays}", decimalDays, roundedDays);
                return roundedDays;
            }

            // Parse strings like "1-2 ngày", "2-3 ngày" (range)
            var rangeMatch = System.Text.RegularExpressions.Regex.Match(timeString, @"(\d+)-(\d+)\s*ngày");
            if (rangeMatch.Success && int.TryParse(rangeMatch.Groups[1].Value, out var minDays) && int.TryParse(rangeMatch.Groups[2].Value, out var maxDays))
            {
                var avgDays = (int)Math.Ceiling((minDays + maxDays) / 2.0);
                _logger.LogInformation("[ParseDeliveryTime] Found range {MinDays}-{MaxDays} days, using average {AvgDays}", minDays, maxDays, avgDays);
                return avgDays;
            }

            _logger.LogWarning("[ParseDeliveryTime] Could not parse time string: '{TimeString}'. Defaulting to 3 days.", timeString);
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

        /// <summary>
        /// Get detailed status description for ViettelPost webhook
        /// </summary>
        private static string GetViettelPostStatusDescription(int status)
        {
            return status switch
            {
                -100 => "Đơn hàng mới tạo, chưa được duyệt",
                -108 => "Đơn hàng đã gửi tại bưu cục",
                -109 => "Đơn hàng đã gửi tại điểm tập kết",
                -110 => "Đơn hàng được bàn giao bởi bưu cục",
                -15 => "Hủy đơn hàng - Trạng thái kết thúc",
                100 => "Nhận đơn hàng của khách hàng - ViettelPost đang xử lý đơn hàng",
                101 => "ViettelPost yêu cầu khách hàng hủy đơn hàng",
                102 => "Đơn hàng đang được xử lý",
                103 => "Giao đến Bưu cục - ViettelPost đang xử lý đơn hàng",
                104 => "Giao đến người nhận - Bưu tá",
                105 => "Bưu tá đã nhận đơn hàng",
                106 => "Đối tác yêu cầu thu hồi đơn hàng",
                107 => "Đối tác yêu cầu hủy đơn hàng qua API",
                200 => "Nhận từ Bưu tá - Bưu cục nhận",
                201 => "Hủy nhập phiếu gửi",
                202 => "Sửa phiếu gửi",
                300 => "Đóng file giao hàng",
                301 => "Đóng gói giao hàng - Giao từ",
                302 => "Đóng track thư giao hàng - Giao từ",
                303 => "Đóng làn xe tải giao hàng - Giao từ",
                400 => "Nhận file thu nhập - Nhận tại",
                401 => "Nhận túi bưu phẩm - Nhận tại",
                402 => "Nhận track thư - Nhận tại",
                403 => "Nhận làn xe tải - Nhận tại",
                500 => "Giao đến Bưu tá giao hàng",
                501 => "Thành công - Giao hàng thành công",
                502 => "Giao trả về Bưu cục người gửi",
                503 => "Hủy - Theo yêu cầu của khách hàng",
                504 => "Thành công - Giao trả về khách hàng",
                505 => "Tồn kho - Giao trả về Bưu cục người gửi",
                506 => "Tồn kho - Khách hàng không nhận",
                507 => "Tồn kho - Khách hàng nhận tại Bưu cục",
                508 => "Đang giao hàng",
                509 => "Giao đến Bưu cục khác",
                510 => "Hủy giao hàng",
                515 => "Bưu cục giao hàng trả đơn hàng chờ duyệt",
                550 => "Yêu cầu Bưu cục giao hàng gửi lại",
                _ => $"Trạng thái không xác định ({status})"
            };
        }

        /// <summary>
        /// Tự động đăng ký kho hàng mặc định từ config
        /// </summary>
        private async Task RegisterDefaultInventoryAsync()
        {
            try
            {
                _logger.LogInformation("🔄 [AUTO-REGISTER] Starting automatic inventory registration...");
                
                var request = new RegisterInventoryRequest
                {
                    Phone = _config.DefaultPickupAddress.Phone,
                    Name = _config.DefaultPickupAddress.Name,
                    Address = _config.DefaultPickupAddress.AddressDetail,
                    WardsId = _config.DefaultPickupAddress.WardId
                };

                _logger.LogInformation("📦 [AUTO-REGISTER] Registering default inventory: {Name} - {Address}", 
                    request.Name, request.Address);

                var result = await RegisterInventoryAsync(request);
                
                if (result.IsSuccess)
                {
                    _logger.LogInformation("✅ [AUTO-REGISTER] Successfully registered default inventory with GROUPADDRESS_ID: {GroupAddressId}", 
                        result.GroupAddressId);
                    
                    // Lưu GROUPADDRESS_ID vào config hoặc cache để sử dụng sau này
                    _config.DefaultPickupAddress.GroupAddressId = result.GroupAddressId;
                }
                else
                {
                    _logger.LogWarning("⚠️ [AUTO-REGISTER] Failed to register default inventory: {Error}", 
                        result.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [AUTO-REGISTER] Error during automatic inventory registration");
            }
        }

        /// <summary>
        /// Đăng ký kho hàng với ViettelPost
        /// </summary>
        public async Task<RegisterInventoryResult> RegisterInventoryAsync(RegisterInventoryRequest request)
        {
            const int maxRetries = 3;
            const int delayMs = 2000; // 2 seconds

            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    // Get valid token before making API call
                    var token = await GetValidTokenAsync();
                    if (string.IsNullOrEmpty(token))
                    {
                        if (attempt < maxRetries)
                        {
                            _logger.LogWarning("⚠️ [RETRY {Attempt}/{MaxRetries}] Failed to get valid token, retrying in {Delay}ms...", 
                                attempt, maxRetries, delayMs);
                            await Task.Delay(delayMs);
                            continue;
                        }
                        
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Không thể lấy token hợp lệ cho ViettelPost API sau nhiều lần thử",
                            ErrorCode = 401
                        };
                    }

                    _httpClient.DefaultRequestHeaders.Clear();
                    _httpClient.DefaultRequestHeaders.Add("Token", token);

                    // Validate required fields theo API documentation
                    if (string.IsNullOrWhiteSpace(request.Phone))
                    {
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Field error may not be blank (phone) - Số điện thoại không được để trống",
                            ErrorCode = 203
                        };
                    }

                    // Validate phone number format (Vietnamese phone number)
                    if (!IsValidVietnamesePhoneNumber(request.Phone))
                    {
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Invalid phone number format - Định dạng số điện thoại không hợp lệ (VD: 0901234567)",
                            ErrorCode = 203
                        };
                    }
                    
                    if (string.IsNullOrWhiteSpace(request.Name))
                    {
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Field error may not be blank (name) - Tên không được để trống",
                            ErrorCode = 203
                        };
                    }
                    
                    if (string.IsNullOrWhiteSpace(request.Address))
                    {
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Field error may not be blank (address) - Địa chỉ không được để trống",
                            ErrorCode = 203
                        };
                    }
                    
                    if (request.WardsId <= 0)
                    {
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = "Invalid ward status - Mã xã/phường không hợp lệ",
                            ErrorCode = 204
                        };
                    }

                    var payload = new
                    {
                        PHONE = request.Phone,           // ✅ VARCHAR2(250) - Phone number
                        NAME = request.Name,             // ✅ VARCHAR2(250) - Full name
                        ADDRESS = request.Address,       // ✅ VARCHAR2(250) - Address
                        WARDS_ID = request.WardsId       // ✅ NUMBER - Ward status
                    };

                    var jsonContent = JsonSerializer.Serialize(payload);
                    var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                    _logger.LogInformation("Registering inventory with ViettelPost (attempt {Attempt}/{MaxRetries}): {Payload}", 
                        attempt, maxRetries, jsonContent);

                    var response = await _httpClient.PostAsync("/v2/user/registerInventory", content);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    _logger.LogInformation("🔄 ViettelPost registerInventory response (attempt {Attempt}): Status={Status}, Content={Response}", 
                        attempt, response.StatusCode, responseContent);

                    // Kiểm tra nếu là lỗi 401 (Unauthorized) - token hết hạn
                    if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        _logger.LogWarning("⚠️ Token expired (401), forcing refresh and retry...");
                        _accessToken = null; // Force token refresh
                        _tokenExpiry = DateTime.MinValue;
                        
                        if (attempt < maxRetries)
                        {
                            await Task.Delay(delayMs);
                            continue; // Retry with new token
                        }
                    }

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("🔍 [DEBUG] Parsing response: {ResponseContent}", responseContent);
                        
                        var options = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var result = JsonSerializer.Deserialize<ViettelPostRegisterInventoryResponse>(responseContent, options);
                        
                        _logger.LogInformation("🔍 [DEBUG] Parsed result: Status={Status}, Error={Error}, DataCount={DataCount}", 
                            result?.Status, result?.Error, result?.Data?.Count);
                        
                        if (result?.Status == 200 && result.Data != null && result.Data.Count > 0)
                        {
                            // Lấy kho mới nhất (đầu tiên trong danh sách)
                            var latestWarehouse = result.Data.First();
                            
                            _logger.LogInformation("✅ [SUCCESS] Warehouse registered successfully: GroupAddressId={GroupAddressId}, Name={Name}", 
                                latestWarehouse.groupaddressId, latestWarehouse.name);
                            
                            return new RegisterInventoryResult
                            {
                                IsSuccess = true,
                                GroupAddressId = latestWarehouse.groupaddressId,
                                Message = "Đăng ký kho hàng thành công"
                            };
                        }
                        else if (result?.Status == 201)
                        {
                            // Account logged in on another machine - force refresh token
                            _logger.LogWarning("⚠️ Account logged in elsewhere (201), forcing token refresh...");
                            _accessToken = null;
                            _tokenExpiry = DateTime.MinValue;
                            
                            if (attempt < maxRetries)
                            {
                                await Task.Delay(delayMs);
                                continue; // Retry with new token
                            }
                        }
                        else
                        {
                            // Xử lý các error status theo API documentation (UPDATED)
                            string errorMessage = result?.Status switch
                            {
                                201 => "Account have logged in on another machine! - Tài khoản đã đăng nhập trên thiết bị khác",
                                202 => "Correct delivery note - Phiếu giao hàng chính xác",
                                203 => "Field error may not be blank (email, phone, address, name ...) - Lỗi trường bắt buộc để trống",
                                204 => "Invalid province, district, ward status! - Mã tỉnh, huyện, xã không hợp lệ",
                                205 => "System error - Lỗi hệ thống ViettelPost",
                                _ => result?.Message ?? "Đăng ký kho hàng thất bại - không có dữ liệu trả về"
                            };
                            
                            _logger.LogError("❌ ViettelPost registerInventory API error: Status={Status}, Error={Error}, Message={Message}, DataNull={DataNull}, DataCount={DataCount}", 
                                result?.Status, result?.Error, result?.Message, result?.Data == null, result?.Data?.Count);
                            
                            return new RegisterInventoryResult
                            {
                                IsSuccess = false,
                                ErrorMessage = errorMessage,
                                ErrorCode = result?.Status ?? 0
                            };
                        }
                    }
                    else
                    {
                        _logger.LogError("❌ HTTP Error {StatusCode}: {ResponseContent}", response.StatusCode, responseContent);
                        
                        return new RegisterInventoryResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"HTTP Error {response.StatusCode}: {responseContent}",
                            ErrorCode = (int)response.StatusCode
                        };
                    }
                }
                catch (TaskCanceledException ex) when (attempt < maxRetries)
                {
                    _logger.LogWarning("⚠️ [RETRY] Attempt {Attempt} failed with timeout, retrying in {DelayMs}ms: {Error}", 
                        attempt, delayMs, ex.Message);
                    
                    if (attempt < maxRetries)
                    {
                        await Task.Delay(delayMs * attempt); // Exponential backoff
                        continue;
                    }
                }
                catch (HttpRequestException ex) when (attempt < maxRetries)
                {
                    _logger.LogWarning("⚠️ [RETRY] Attempt {Attempt} failed with HTTP error, retrying in {DelayMs}ms: {Error}", 
                        attempt, delayMs, ex.Message);
                    
                    if (attempt < maxRetries)
                    {
                        await Task.Delay(delayMs * attempt); // Exponential backoff
                        continue;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [FINAL] Attempt {Attempt} failed with unexpected error", attempt);
                    return new RegisterInventoryResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Lỗi không mong đợi: {ex.Message}"
                    };
                }
            }

            // Nếu tất cả retry đều thất bại
            return new RegisterInventoryResult
            {
                IsSuccess = false,
                ErrorMessage = $"Đăng ký kho hàng thất bại sau {maxRetries} lần thử"
            };
        }

        /// <summary>
        /// Validate Vietnamese phone number format using centralized validator
        /// </summary>
        private static bool IsValidVietnamesePhoneNumber(string phoneNumber)
        {
            return backend.Utilities.AddressValidator.IsValidVietnamesePhoneNumber(phoneNumber);
        }

        /// <summary>
        /// 🔥 COMPREHENSIVE SHIPPING REQUEST VALIDATION
        /// </summary>
        private async Task<ShippingValidationResult> ValidateShippingRequestAsync(CalculateShippingFeeRequest request)
        {
            var result = new ShippingValidationResult { IsValid = true };

            // 1. Basic request validation
            if (request == null)
            {
                result.IsValid = false;
                result.Errors.Add("Shipping request is null");
                return result;
            }

            // 2. Weight validation
            if (request.Weight <= 0)
            {
                result.IsValid = false;
                result.Errors.Add("Trọng lượng phải lớn hơn 0 gram");
            }
            else if (request.Weight < _config.BusinessRules.MinWeightGrams)
            {
                result.IsValid = false;
                result.Errors.Add($"Trọng lượng phải từ {_config.BusinessRules.MinWeightGrams}g trở lên");
            }
            else if (request.Weight > _config.BusinessRules.MaxWeightGrams)
            {
                result.IsValid = false;
                result.Errors.Add($"Trọng lượng vượt quá giới hạn {_config.BusinessRules.MaxWeightGrams / 1000}kg của ViettelPost");
            }

            // 3. Insurance value validation
            if (request.InsuranceValue < 0)
            {
                result.IsValid = false;
                result.Errors.Add("Giá trị bảo hiểm không được âm");
            }
            else if (request.InsuranceValue > _config.BusinessRules.MaxInsuranceValue)
            {
                result.IsValid = false;
                result.Errors.Add($"Giá trị bảo hiểm vượt quá giới hạn {_config.BusinessRules.MaxInsuranceValue:N0} VND");
            }

            // 4. COD amount validation
            if (request.CodAmount < 0)
            {
                result.IsValid = false;
                result.Errors.Add("Số tiền thu hộ không được âm");
            }
            else if (request.CodAmount > _config.BusinessRules.MaxCodAmount)
            {
                result.IsValid = false;
                result.Errors.Add($"Số tiền thu hộ vượt quá giới hạn {_config.BusinessRules.MaxCodAmount:N0} VND");
            }

            // 5. FROM Address validation
            if (request.FromAddress == null)
            {
                result.IsValid = false;
                result.Errors.Add("Địa chỉ gửi hàng không được để trống");
            }
            else
            {
                var fromValidation = ValidateShippingAddress(request.FromAddress, "gửi hàng");
                if (!fromValidation.IsValid)
                {
                    result.IsValid = false;
                    result.Errors.AddRange(fromValidation.Errors);
                }
                result.Warnings.AddRange(fromValidation.Warnings);
            }

            // 6. TO Address validation
            if (request.ToAddress == null)
            {
                result.IsValid = false;
                result.Errors.Add("Địa chỉ nhận hàng không được để trống");
            }
            else
            {
                var toValidation = ValidateShippingAddress(request.ToAddress, "nhận hàng");
                if (!toValidation.IsValid)
                {
                    result.IsValid = false;
                    result.Errors.AddRange(toValidation.Errors);
                }
                result.Warnings.AddRange(toValidation.Warnings);
            }

            // 7. Cross-validation
            if (request.FromAddress != null && request.ToAddress != null)
            {
                if (request.FromAddress.Province?.Equals(request.ToAddress.Province, StringComparison.OrdinalIgnoreCase) == true &&
                    request.FromAddress.District?.Equals(request.ToAddress.District, StringComparison.OrdinalIgnoreCase) == true)
                {
                    result.Warnings.Add("Gửi và nhận trong cùng quận/huyện - có thể có phí vận chuyển đặc biệt");
                }
            }

            return result;
        }

        /// <summary>
        /// Validate individual shipping address
        /// </summary>
        private backend.Utilities.ShippingAddressValidationResult ValidateShippingAddress(ShippingAddressDto address, string addressType)
        {
            var userAddress = new Models.UserAddress
            {
                FullName = address.Name ?? "",
                PhoneNumber = address.Phone ?? "",
                AddressLine = address.AddressDetail ?? "",
                Ward = address.Ward ?? "",
                District = address.District ?? "",
                Province = address.Province ?? ""
            };

            var validation = backend.Utilities.AddressValidator.ValidateForShipping(userAddress);
            
            // Add context to errors
            for (int i = 0; i < validation.Errors.Count; i++)
            {
                validation.Errors[i] = $"Địa chỉ {addressType}: {validation.Errors[i]}";
            }
            
            for (int i = 0; i < validation.Warnings.Count; i++)
            {
                validation.Warnings[i] = $"Địa chỉ {addressType}: {validation.Warnings[i]}";
            }

            return validation;
        }

        /// <summary>
        /// 🔥 ENHANCED ADDRESS MAPPING WITH COMPREHENSIVE ERROR HANDLING
        /// </summary>
        private async Task<AddressMappingResult> MapAddressesWithValidationAsync(CalculateShippingFeeRequest request)
        {
            try
            {
                // Map sender address
                var senderProvinceId = request.FromAddress.ProvinceId ?? await GetProvinceIdWithErrorAsync(request.FromAddress.Province, "sender");
                var senderDistrictId = request.FromAddress.DistrictId ?? await GetDistrictIdWithErrorAsync(request.FromAddress.District, senderProvinceId, "sender");

                // Map receiver address
                var receiverProvinceId = request.ToAddress.ProvinceId ?? await GetProvinceIdWithErrorAsync(request.ToAddress.Province, "receiver");
                var receiverDistrictId = request.ToAddress.DistrictId ?? await GetDistrictIdWithErrorAsync(request.ToAddress.District, receiverProvinceId, "receiver");

                // Validate all IDs were resolved successfully
                if (senderProvinceId <= 0)
                {
                    return new AddressMappingResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Không thể xác định ID tỉnh gửi hàng: '{request.FromAddress.Province}'. Vui lòng kiểm tra tên tỉnh/thành phố."
                    };
                }

                if (senderDistrictId <= 0)
                {
                    return new AddressMappingResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Không thể xác định ID quận/huyện gửi hàng: '{request.FromAddress.District}' trong tỉnh '{request.FromAddress.Province}'. Vui lòng kiểm tra tên quận/huyện."
                    };
                }

                if (receiverProvinceId <= 0)
                {
                    return new AddressMappingResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Không thể xác định ID tỉnh nhận hàng: '{request.ToAddress.Province}'. Vui lòng kiểm tra tên tỉnh/thành phố."
                    };
                }

                if (receiverDistrictId <= 0)
                {
                    return new AddressMappingResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Không thể xác định ID quận/huyện nhận hàng: '{request.ToAddress.District}' trong tỉnh '{request.ToAddress.Province}'. Vui lòng kiểm tra tên quận/huyện."
                    };
                }

                return new AddressMappingResult
                {
                    IsValid = true,
                    SenderProvinceId = senderProvinceId,
                    SenderDistrictId = senderDistrictId,
                    ReceiverProvinceId = receiverProvinceId,
                    ReceiverDistrictId = receiverDistrictId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during address mapping");
                return new AddressMappingResult
                {
                    IsValid = false,
                    ErrorMessage = $"Lỗi hệ thống khi xác định địa chỉ: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Get province ID with enhanced error handling
        /// </summary>
        private async Task<int> GetProvinceIdWithErrorAsync(string provinceName, string addressType)
        {
            if (string.IsNullOrWhiteSpace(provinceName))
            {
                _logger.LogError("❌ Empty province name for {AddressType}", addressType);
                return -1;
            }

            try
            {
                var provinceId = await GetProvinceIdAsync(provinceName);
                if (provinceId <= 0)
                {
                    _logger.LogError("❌ Failed to map province '{ProvinceName}' for {AddressType}", provinceName, addressType);
                }
                return provinceId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Exception mapping province '{ProvinceName}' for {AddressType}", provinceName, addressType);
                return -1;
            }
        }

        /// <summary>
        /// Get district ID with enhanced error handling
        /// </summary>
        private async Task<int> GetDistrictIdWithErrorAsync(string districtName, int provinceId, string addressType)
        {
            if (string.IsNullOrWhiteSpace(districtName))
            {
                _logger.LogError("❌ Empty district name for {AddressType}", addressType);
                return -1;
            }

            if (provinceId <= 0)
            {
                _logger.LogError("❌ Invalid province ID {ProvinceId} for district '{DistrictName}' ({AddressType})", provinceId, districtName, addressType);
                return -1;
            }

            try
            {
                var districtId = await GetDistrictIdAsync(districtName, provinceId);
                if (districtId <= 0)
                {
                    _logger.LogError("❌ Failed to map district '{DistrictName}' in province {ProvinceId} for {AddressType}", districtName, provinceId, addressType);
                }
                return districtId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Exception mapping district '{DistrictName}' in province {ProvinceId} for {AddressType}", districtName, provinceId, addressType);
                return -1;
            }
        }
    }

    #region Helper Classes for Enhanced Validation

    /// <summary>
    /// Result of shipping request validation
    /// </summary>
    public class ShippingValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
    }

    /// <summary>
    /// Result of address mapping with ViettelPost IDs
    /// </summary>
    public class AddressMappingResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public int SenderProvinceId { get; set; }
        public int SenderDistrictId { get; set; }
        public int ReceiverProvinceId { get; set; }
        public int ReceiverDistrictId { get; set; }

        /// <summary>
        /// Deconstruct for easy unpacking: var (senderProvId, senderDistId, receiverProvId, receiverDistId) = result;
        /// </summary>
        public void Deconstruct(out int senderProvinceId, out int senderDistrictId, out int receiverProvinceId, out int receiverDistrictId)
        {
            senderProvinceId = SenderProvinceId;
            senderDistrictId = SenderDistrictId;
            receiverProvinceId = ReceiverProvinceId;
            receiverDistrictId = ReceiverDistrictId;
        }
    }

    #endregion

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
        public decimal MONEY_COLLECTTION { get; set; }
        public decimal EXCHANGE_WEIGHT { get; set; }
        public decimal MONEY_OTHER_FEE { get; set; }
        public decimal MONEY_FEE { get; set; }
        public decimal MONEY_COLLECTION_FEE { get; set; }
        public decimal MONEY_FEE_VAT { get; set; }
        public decimal MONEY_TOTAL_FEE { get; set; }
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

    public class ViettelPostRegisterInventoryResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ViettelPostRegisterInventoryData>? Data { get; set; }
    }

    public class ViettelPostRegisterInventoryData
    {
        public int groupaddressId { get; set; }    // ✅ NUMBER - Store ID
        public int cusId { get; set; }              // ✅ NUMBER - Customer ID
        public string name { get; set; } = string.Empty;     // ✅ VARCHAR2(250) - Customer name
        public string phone { get; set; } = string.Empty;    // ✅ VARCHAR2(250) - Phone number
        public string address { get; set; } = string.Empty;  // ✅ VARCHAR2(250) - Address
        public int provinceId { get; set; }         // ✅ NUMBER - Province/city status
        public int districtId { get; set; }         // ✅ NUMBER - District status
        public int wardsId { get; set; }            // ✅ NUMBER - Ward status
        public object? postId { get; set; }
        public object? merchant { get; set; }
    }

    public class ViettelPostListInventoryResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ViettelPostListInventoryData>? Data { get; set; }
    }

    public class ViettelPostListInventoryData
    {
        public int groupaddressId { get; set; }    // ✅ NUMBER - Store ID
        public int cusId { get; set; }              // ✅ NUMBER - Customer ID
        public string name { get; set; } = string.Empty;     // ✅ VARCHAR2(250) - Customer name
        public string phone { get; set; } = string.Empty;    // ✅ VARCHAR2(250) - Phone number
        public string address { get; set; } = string.Empty;  // ✅ VARCHAR2(250) - Address
        public int provinceId { get; set; }         // ✅ NUMBER - Province/city status
        public int districtId { get; set; }         // ✅ NUMBER - District status
        public int wardsId { get; set; }            // ✅ NUMBER - Ward status
    }

    public class ViettelPostUpdateOrderResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public ViettelPostUpdateOrderData? Data { get; set; }
    }

    public class ViettelPostUpdateOrderData
    {
        public string ORDER_NUMBER { get; set; } = string.Empty;
        public string ORDER_REFERENCE { get; set; } = string.Empty;
        public string ORDER_STATUSDATE { get; set; } = string.Empty;
        public int ORDER_STATUS { get; set; }
        public string STATUS_NAME { get; set; } = string.Empty;
        public string LOCALION_CURRENTLY { get; set; } = string.Empty;
        public string NOTE { get; set; } = string.Empty;
        public decimal MONEY_COLLECTION { get; set; }
        public decimal MONEY_TOTAL { get; set; }
        public decimal PRODUCT_WEIGHT { get; set; }
        public decimal MONEY_COLLECTION_ORIGIN { get; set; }
        public string EMPLOYEE_NAME { get; set; } = string.Empty;
        public string EMPLOYEE_PHONE { get; set; } = string.Empty;
        public decimal VOUCHER_VALUE { get; set; }
        public string EXPECTED_DELIVERY_DATE { get; set; } = string.Empty;
        public decimal MONEY_FEECOD { get; set; }
        public int ORDER_PAYMENT { get; set; }
        public string EXPECTED_DELIVERY { get; set; } = string.Empty;
        public string ORDER_SERVICE { get; set; } = string.Empty;
        public decimal MONEY_TOTALFEE { get; set; }
        public string DETAIL { get; set; } = string.Empty;
        public string MESSAGE { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response from ViettelPost /v2/order/UpdateOrder API (Update order status)
    /// </summary>
    public class ViettelPostUpdateOrderStatusResponse
    {
        [JsonPropertyName("status")]
        public int Status { get; set; }
        
        [JsonPropertyName("error")]
        public bool Error { get; set; }
        
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
        
        [JsonPropertyName("data")]
        public object? Data { get; set; } // Usually null for this API
    }
    #endregion
}
