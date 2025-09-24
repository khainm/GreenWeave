using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace backend.Services
{
    /// <summary>
    /// Service for managing shipping operations across multiple providers
    /// </summary>
    public class ShippingService : IShippingService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IShippingRequestRepository _shippingRequestRepository;
        private readonly IShippingTransactionRepository _shippingTransactionRepository;
        private readonly IWebhookLogService _webhookLogService;
        private readonly IEnumerable<IShippingProvider> _shippingProviders;
        private readonly ShippingConfiguration _config;
        private readonly ILogger<ShippingService> _logger;

        public ShippingService(
            IOrderRepository orderRepository,
            IShippingRequestRepository shippingRequestRepository,
            IShippingTransactionRepository shippingTransactionRepository,
            IWebhookLogService webhookLogService,
            IEnumerable<IShippingProvider> shippingProviders,
            IOptions<ShippingConfiguration> shippingConfig,
            ILogger<ShippingService> logger)
        {
            _orderRepository = orderRepository;
            _shippingRequestRepository = shippingRequestRepository;
            _shippingTransactionRepository = shippingTransactionRepository;
            _webhookLogService = webhookLogService;
            _shippingProviders = shippingProviders;
            _config = shippingConfig.Value;
            _logger = logger;
        }

        public async Task<ShippingOptionsResponseDto> GetShippingOptionsAsync(CalculateShippingFeeRequest request)
        {
            var options = new List<ShippingOptionDto>();

            // Get all enabled providers
            var enabledProviders = new List<ShippingProvider>();
            
            if (_config.ViettelPost.IsEnabled)
                enabledProviders.Add(ShippingProvider.ViettelPost);

            // Get all shipping options for each enabled provider
            var tasks = enabledProviders.Select(async provider =>
            {
                try
                {
                    var providerInstance = _shippingProviders.FirstOrDefault(p => p.Provider == provider);
                    if (providerInstance == null)
                    {
                        _logger.LogWarning("Provider {Provider} not found", provider);
                        return new List<ShippingOptionDto>();
                    }

                    // Check if provider is available
                    if (!await providerInstance.IsAvailableAsync())
                    {
                        _logger.LogWarning("Provider {Provider} is not available", provider);
                        return new List<ShippingOptionDto>();
                    }

                    // Get all options from provider
                    var providerOptions = await providerInstance.GetShippingOptionsAsync(request);
                    _logger.LogInformation("Provider {Provider} returned {Count} options", provider, providerOptions.Count);
                    
                    // If no options returned, it means API failed - don't add anything
                    if (providerOptions.Count == 0)
                    {
                        _logger.LogWarning("Provider {Provider} returned no options, likely API failure", provider);
                    }
                    
                    return providerOptions;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting options for provider {Provider}", provider);
                    return new List<ShippingOptionDto>();
                }
            });

            var allOptions = await Task.WhenAll(tasks);
            options.AddRange(allOptions.SelectMany(x => x));

            _logger.LogInformation("Total shipping options found: {Count}", options.Count);

            // If no options found from any provider, return empty list
            // Frontend will handle this by showing appropriate message
            if (options.Count == 0)
            {
                _logger.LogWarning("No shipping options available from any provider");
            }

            return new ShippingOptionsResponseDto
            {
                Options = options.OrderBy(o => o.Fee).ToList()
            };
        }

        public async Task<FeeResult> CalculateShippingFeeAsync(CalculateShippingFeeRequest request)
        {
            try
            {
                // Find the appropriate provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == request.Provider);
                if (provider == null)
                {
                    return new FeeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Provider {request.Provider} not found"
                    };
                }

                // Check if provider is available
                if (!await provider.IsAvailableAsync())
                {
                    return new FeeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Provider {request.Provider} is not available"
                    };
                }

                // Log the transaction
                await LogTransactionAsync(null, "CalculateFee", request.Provider.ToString(), 
                    JsonSerializer.Serialize(request), null, null, true, null);

                return await provider.CalculateFeeAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating shipping fee for provider {Provider}", request.Provider);
                
                await LogTransactionAsync(null, "CalculateFee", request.Provider.ToString(), 
                    JsonSerializer.Serialize(request), null, null, false, ex.Message);

                return new FeeResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<CreateShipmentResult> CreateShipmentAsync(CreateShipmentRequest request)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(request.OrderId);
                if (order == null)
                {
                    return new CreateShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Order not found"
                    };
                }

                // Check if shipping request already exists
                var existingRequest = await _shippingRequestRepository.GetByOrderIdAsync(request.OrderId);
                if (existingRequest != null)
                {
                    return new CreateShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Shipping request already exists for this order"
                    };
                }

                // Create shipping request
                var shippingRequest = await CreateShippingRequestAsync(order, request);


                // Find the appropriate provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == request.Provider);
                if (provider == null)
                {
                    return new CreateShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Provider {request.Provider} not found"
                    };
                }

                // Create shipment with provider
                var result = await provider.CreateShipmentAsync(order, shippingRequest);

                // Update shipping request with result
                if (result.IsSuccess)
                {
                    shippingRequest.TrackingCode = result.TrackingCode;
                    shippingRequest.ExternalId = result.ExternalId;
                    shippingRequest.Status = ShippingStatus.PendingPickup;
                    
                    // Update order
                    order.ShippingCode = result.TrackingCode;
                    order.ShippingStatus = ShippingStatus.PendingPickup;
                    order.UpdatedAt = DateTime.UtcNow;

                    await _shippingRequestRepository.UpdateAsync(shippingRequest);
                    await _orderRepository.UpdateAsync(order);
                }

                // Log the transaction
                await LogTransactionAsync(shippingRequest.Id, "CreateShipment", request.Provider.ToString(),
                    JsonSerializer.Serialize(request), JsonSerializer.Serialize(result), null, 
                    result.IsSuccess, result.ErrorMessage);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipment for order {OrderId}", request.OrderId);
                return new CreateShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<UpdateOrderResult> UpdateOrderAsync(int orderId, UpdateOrderRequest request)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Order not found"
                    };
                }

                // Check if shipping request exists
                var existingRequest = await _shippingRequestRepository.GetByOrderIdAsync(orderId);
                if (existingRequest == null)
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "No shipping request found for this order"
                    };
                }

                // Update shipping request with new data
                existingRequest.FromAddress = JsonSerializer.Serialize(request.FromAddress);
                existingRequest.ToAddress = JsonSerializer.Serialize(request.ToAddress);
                existingRequest.Note = request.Note;
                existingRequest.CodAmount = request.CodAmount;
                existingRequest.UpdatedAt = DateTime.UtcNow;

                // Find the appropriate provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == order.ShippingProvider);
                if (provider == null)
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Provider {order.ShippingProvider} not found"
                    };
                }

                // Update order with provider
                var result = await provider.UpdateOrderAsync(order, existingRequest);

                // Update database if successful
                if (result.IsSuccess)
                {
                    await _shippingRequestRepository.UpdateAsync(existingRequest);
                    
                    // Update order if needed
                    order.UpdatedAt = DateTime.UtcNow;
                    await _orderRepository.UpdateAsync(order);
                }

                // Log the transaction
                await LogTransactionAsync(existingRequest.Id, "UpdateOrder", order.ShippingProvider.ToString(),
                    JsonSerializer.Serialize(request), JsonSerializer.Serialize(result), null, 
                    result.IsSuccess, result.ErrorMessage);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", orderId);
                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<CancelShipmentResult> CancelShipmentAsync(int orderId, string reason)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new CancelShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Order not found"
                    };
                }

                var shippingRequest = await _shippingRequestRepository.GetByOrderIdAsync(orderId);
                if (shippingRequest == null || string.IsNullOrEmpty(shippingRequest.TrackingCode))
                {
                    return new CancelShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "No active shipment found for this order"
                    };
                }


                // Find the appropriate provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == order.ShippingProvider);
                if (provider == null)
                {
                    return new CancelShipmentResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Provider {order.ShippingProvider} not found"
                    };
                }

                var result = await provider.CancelShipmentAsync(shippingRequest.TrackingCode, reason);

                // Update shipping request and order
                if (result.IsSuccess)
                {
                    shippingRequest.Status = ShippingStatus.Cancelled;
                    shippingRequest.CancelledAt = DateTime.UtcNow;
                    shippingRequest.CancelReason = reason;
                    
                    order.ShippingStatus = ShippingStatus.Cancelled;
                    order.UpdatedAt = DateTime.UtcNow;

                    await _shippingRequestRepository.UpdateAsync(shippingRequest);
                    await _orderRepository.UpdateAsync(order);
                }

                // Log the transaction
                await LogTransactionAsync(shippingRequest.Id, "CancelShipment", order.ShippingProvider.ToString(),
                    JsonSerializer.Serialize(new { TrackingCode = shippingRequest.TrackingCode, Reason = reason }),
                    JsonSerializer.Serialize(result), null, result.IsSuccess, result.ErrorMessage);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling shipment for order {OrderId}", orderId);
                return new CancelShipmentResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<TrackingResponseDto?> GetTrackingAsync(int orderId)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null || string.IsNullOrEmpty(order.ShippingCode))
                {
                    return null;
                }

                var shippingRequest = await _shippingRequestRepository.GetByOrderIdAsync(orderId);


                // Find the appropriate provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == order.ShippingProvider);
                if (provider == null)
                {
                    return null;
                }

                var result = await provider.GetTrackingAsync(order.ShippingCode);

                if (result.IsSuccess)
                {
                    // Update order shipping status if changed
                    if (order.ShippingStatus != result.Status)
                    {
                        order.ShippingStatus = result.Status;
                        order.UpdatedAt = DateTime.UtcNow;
                        
                        // Update shipping history
                        var history = GetShippingHistory(order.ShippingHistory);
                        history.Add(new TrackingEvent
                        {
                            Timestamp = DateTime.UtcNow,
                            Status = result.Status.ToString(),
                            Description = result.StatusDescription ?? "",
                            Location = result.CurrentLocation
                        });
                        order.ShippingHistory = JsonSerializer.Serialize(history);

                        await _orderRepository.UpdateAsync(order);
                    }

                    return new TrackingResponseDto
                    {
                        TrackingCode = order.ShippingCode,
                        Status = result.Status.ToString(),
                        StatusDescription = result.StatusDescription ?? "",
                        Events = result.Events.Select(e => new TrackingEventDto
                        {
                            Timestamp = e.Timestamp,
                            Status = e.Status,
                            Description = e.Description,
                            Location = e.Location
                        }).ToList(),
                        EstimatedDeliveryDate = result.EstimatedDeliveryDate,
                        CurrentLocation = result.CurrentLocation
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tracking for order {OrderId}", orderId);
                return null;
            }
        }

        public async Task<bool> ProcessWebhookAsync(ShippingProvider provider, string webhookData)
        {
            try
            {
                var shippingProvider = _shippingProviders.FirstOrDefault(p => p.Provider == provider);
                if (shippingProvider == null)
                {
                    return false;
                }

                var webhookInfo = await shippingProvider.ProcessWebhookAsync(webhookData);
                if (webhookInfo == null)
                {
                    return false;
                }

                // Parse webhook data for logging
                var webhookPayload = JsonSerializer.Deserialize<ViettelPostWebhookData>(webhookData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // Find order by tracking code
                var shippingRequest = await _shippingRequestRepository.GetByTrackingCodeAsync(webhookInfo.TrackingCode);
                var order = shippingRequest?.Order;

                bool isSuccess = false;
                string? errorMessage = null;

                try
                {
                    if (order == null)
                    {
                        _logger.LogWarning("Order not found for tracking code {TrackingCode}", webhookInfo.TrackingCode);
                        errorMessage = $"Order not found for tracking code {webhookInfo.TrackingCode}";
                    }
                    else
                    {
                        // Update shipping status
                        var newStatus = MapStringToShippingStatus(webhookInfo.Status);
                        if (order.ShippingStatus != newStatus)
                        {
                            order.ShippingStatus = newStatus;
                            order.UpdatedAt = DateTime.UtcNow;

                            // Update shipping history
                            var history = GetShippingHistory(order.ShippingHistory);
                            history.Add(new TrackingEvent
                            {
                                Timestamp = webhookInfo.Timestamp,
                                Status = webhookInfo.Status,
                                Description = webhookInfo.Description ?? "",
                                Location = webhookInfo.Location
                            });
                            order.ShippingHistory = JsonSerializer.Serialize(history);

                            await _orderRepository.UpdateAsync(order);
                        }

                        isSuccess = true;
                        _logger.LogInformation("Successfully processed webhook for tracking code {TrackingCode}", 
                            webhookInfo.TrackingCode);
                    }
                }
                catch (Exception ex)
                {
                    errorMessage = ex.Message;
                    _logger.LogError(ex, "Error processing webhook for tracking code {TrackingCode}", webhookInfo.TrackingCode);
                }

                // Log webhook event
                if (webhookPayload != null)
                {
                    await _webhookLogService.LogWebhookAsync(
                        webhookPayload,
                        isSuccess,
                        errorMessage,
                        order?.Id,
                        shippingRequest?.Id
                    );
                }

                return isSuccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook for provider {Provider}", provider);
                return false;
            }
        }

        public async Task<ShippingRequestResponseDto?> GetShippingRequestAsync(int orderId)
        {
            var shippingRequest = await _shippingRequestRepository.GetByOrderIdAsync(orderId);
            if (shippingRequest == null)
            {
                return null;
            }

            return new ShippingRequestResponseDto
            {
                Id = shippingRequest.Id,
                OrderId = shippingRequest.OrderId,
                Provider = shippingRequest.Provider.ToString(),
                ServiceId = shippingRequest.ServiceId,
                Fee = shippingRequest.Fee,
                Status = shippingRequest.Status.ToString(),
                TrackingCode = shippingRequest.TrackingCode,
                ExternalId = shippingRequest.ExternalId,
                CreatedAt = shippingRequest.CreatedAt,
                PickedAt = shippingRequest.PickedAt,
                DeliveredAt = shippingRequest.DeliveredAt,
                Note = shippingRequest.Note
            };
        }

        // Private helper methods





        private async Task<ShippingRequest> CreateShippingRequestAsync(Order order, CreateShipmentRequest request)
        {
            // Calculate fee if not already done
            var feeRequest = new CalculateShippingFeeRequest
            {
                Provider = request.Provider,
                FromAddress = GetDefaultFromAddress(),
                ToAddress = MapOrderAddressToShippingAddress(order.ShippingAddress),
                Weight = 500, // Default weight
                InsuranceValue = order.Total,
                CodAmount = 0, // Assuming prepaid
                ServiceId = request.ServiceId
            };

            var feeResult = await CalculateShippingFeeAsync(feeRequest);

            var shippingRequest = new ShippingRequest
            {
                OrderId = order.Id,
                Provider = request.Provider,
                ServiceId = request.ServiceId,
                FromAddress = JsonSerializer.Serialize(feeRequest.FromAddress),
                ToAddress = JsonSerializer.Serialize(feeRequest.ToAddress),
                Weight = feeRequest.Weight,
                Fee = feeResult.IsSuccess ? feeResult.Fee : 0,
                InsuranceValue = feeRequest.InsuranceValue,
                CodAmount = feeRequest.CodAmount,
                Note = request.Note,
                Status = ShippingStatus.PendingPickup,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return await _shippingRequestRepository.CreateAsync(shippingRequest);
        }

        private async Task LogTransactionAsync(int? shippingRequestId, string operation, string provider,
            string? requestData, string? responseData, int? statusCode, bool isSuccess, string? errorMessage)
        {
            try
            {
                var transaction = new ShippingTransaction
                {
                    ShippingRequestId = shippingRequestId ?? 0,
                    Operation = operation,
                    HttpMethod = "POST",
                    RequestData = requestData,
                    ResponseData = responseData,
                    StatusCode = statusCode,
                    IsSuccess = isSuccess,
                    ErrorMessage = errorMessage,
                    CreatedAt = DateTime.UtcNow
                };

                await _shippingTransactionRepository.CreateAsync(transaction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging shipping transaction");
            }
        }

        private static string GetProviderDisplayName(ShippingProvider provider)
        {
            return provider switch
            {
                ShippingProvider.ViettelPost => "Viettel Post",
                _ => provider.ToString()
            };
        }

        private ShippingAddressDto GetDefaultFromAddress()
        {
            return new ShippingAddressDto
            {
                Name = _config.ViettelPost.DefaultPickupAddress.Name,
                Phone = _config.ViettelPost.DefaultPickupAddress.Phone,
                AddressDetail = _config.ViettelPost.DefaultPickupAddress.AddressDetail,
                Ward = _config.ViettelPost.DefaultPickupAddress.WardName,
                District = _config.ViettelPost.DefaultPickupAddress.DistrictName,
                Province = _config.ViettelPost.DefaultPickupAddress.ProvinceName,
                ProvinceId = _config.ViettelPost.DefaultPickupAddress.ProvinceId,
                DistrictId = _config.ViettelPost.DefaultPickupAddress.DistrictId,
                WardId = _config.ViettelPost.DefaultPickupAddress.WardId
            };
        }

        private static ShippingAddressDto MapOrderAddressToShippingAddress(UserAddress address)
        {
            return new ShippingAddressDto
            {
                Name = address.FullName,
                Phone = address.PhoneNumber,
                AddressDetail = address.AddressLine,
                Ward = address.Ward,
                District = address.District,
                Province = address.Province
            };
        }

        private static List<TrackingEvent> GetShippingHistory(string? historyJson)
        {
            if (string.IsNullOrEmpty(historyJson))
            {
                return new List<TrackingEvent>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<TrackingEvent>>(historyJson) ?? new List<TrackingEvent>();
            }
            catch
            {
                return new List<TrackingEvent>();
            }
        }

        private static ShippingStatus MapStringToShippingStatus(string status)
        {
            return status.ToLower() switch
            {
                "pending" or "100" => ShippingStatus.PendingPickup,
                "picked" or "101" => ShippingStatus.Picked,
                "in_transit" or "102" => ShippingStatus.InTransit,
                "out_for_delivery" or "200" => ShippingStatus.OutForDelivery,
                "delivered" or "300" => ShippingStatus.Delivered,
                "failed" or "400" => ShippingStatus.Failed,
                "returning" or "500" => ShippingStatus.Returning,
                "returned" or "600" => ShippingStatus.Returned,
                "cancelled" or "700" => ShippingStatus.Cancelled,
                _ => ShippingStatus.PendingPickup
            };
        }

        private static string GetStatusDescription(ShippingStatus status)
        {
            return status switch
            {
                ShippingStatus.PendingPickup => "Chờ lấy hàng",
                ShippingStatus.Picked => "Đã lấy hàng",
                ShippingStatus.InTransit => "Đang vận chuyển",
                ShippingStatus.OutForDelivery => "Đang giao hàng",
                ShippingStatus.Delivered => "Đã giao hàng",
                ShippingStatus.Failed => "Giao hàng thất bại",
                ShippingStatus.Returning => "Đang hoàn trả",
                ShippingStatus.Returned => "Đã hoàn trả",
                ShippingStatus.Cancelled => "Đã hủy",
                _ => "Không xác định"
            };
        }

        /// <summary>
        /// Lấy danh sách kho hàng từ Viettel Post
        /// </summary>
        /// <returns>Kết quả lấy danh sách kho hàng</returns>
        public async Task<ListInventoryResult> ListInventoryAsync()
        {
            try
            {
                var viettelPostProvider = _shippingProviders.FirstOrDefault(p => p.Provider == ShippingProvider.ViettelPost);
                if (viettelPostProvider == null)
                {
                    return new ListInventoryResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "ViettelPost provider không khả dụng"
                    };
                }

                return await viettelPostProvider.ListInventoryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing inventory");
                return new ListInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }
}
