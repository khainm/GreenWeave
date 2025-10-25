using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Options;
using System.Text.Json;
using backend.Data;
using Microsoft.EntityFrameworkCore;


namespace backend.Services
{
    /// <summary>
    /// Shipping service orchestrates shipping operations across multiple providers
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
        private readonly ApplicationDbContext _dbContext;
        private readonly IWarehouseService _warehouseService;

        public ShippingService(
            IOrderRepository orderRepository,
            IShippingRequestRepository shippingRequestRepository,
            IShippingTransactionRepository shippingTransactionRepository,
            IWebhookLogService webhookLogService,
            IEnumerable<IShippingProvider> shippingProviders,
            IOptions<ShippingConfiguration> shippingConfig,
            ILogger<ShippingService> logger,
            ApplicationDbContext dbContext,
            IWarehouseService warehouseService)
        {
            _orderRepository = orderRepository;
            _shippingRequestRepository = shippingRequestRepository;
            _shippingTransactionRepository = shippingTransactionRepository;
            _webhookLogService = webhookLogService;
            _shippingProviders = shippingProviders;
            _config = shippingConfig.Value;
            _logger = logger;
            _dbContext = dbContext;
            _warehouseService = warehouseService;
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

        /// <summary>
        /// ✅ NEW: Get e-commerce shipping options (warehouse → customer)
        /// Uses intelligent warehouse selection based on customer address
        /// </summary>
        public async Task<ShippingOptionsResponseDto> GetEcommerceShippingOptionsAsync(CalculateEcommerceShippingFeeRequest request)
        {
            _logger.LogInformation("🚀 Getting e-commerce shipping options for customer");

            // ✅ SMART WAREHOUSE SELECTION
            // Try to get optimal warehouse based on customer address
            WarehouseDto? optimalWarehouse = null;
            ShippingAddressDto warehouseAddress;

            if (request.ToAddress.ProvinceId.HasValue && request.ToAddress.DistrictId.HasValue)
            {
                _logger.LogInformation("🔍 Finding optimal warehouse for customer address (Province: {ProvinceId}, District: {DistrictId})",
                    request.ToAddress.ProvinceId, request.ToAddress.DistrictId);

                optimalWarehouse = await _warehouseService.GetOptimalWarehouseForShippingAsync(
                    request.ToAddress.ProvinceId.Value,
                    request.ToAddress.DistrictId.Value,
                    null // TODO: Pass productIds when available
                );
            }

            if (optimalWarehouse != null)
            {
                _logger.LogInformation("✅ Using optimal warehouse: {WarehouseName} (ID: {WarehouseId})",
                    optimalWarehouse.Name, optimalWarehouse.Id);
                
                warehouseAddress = new ShippingAddressDto
                {
                    Name = optimalWarehouse.Name,
                    Phone = optimalWarehouse.Phone,
                    AddressDetail = optimalWarehouse.AddressDetail,
                    Ward = optimalWarehouse.WardName,
                    District = optimalWarehouse.DistrictName,
                    Province = optimalWarehouse.ProvinceName,
                    ProvinceId = optimalWarehouse.ProvinceId,
                    DistrictId = optimalWarehouse.DistrictId,
                    WardId = optimalWarehouse.WardId
                };
            }
            else
            {
                // Fallback to default warehouse
                _logger.LogWarning("⚠️ No optimal warehouse found, using default warehouse");
                warehouseAddress = await GetDefaultWarehouseAddressAsync();
            }
            
            var standardRequest = new CalculateShippingFeeRequest
            {
                FromAddress = warehouseAddress,
                ToAddress = request.ToAddress,
                Weight = request.Weight,
                Dimensions = request.Dimensions,
                InsuranceValue = request.InsuranceValue,
                CodAmount = request.CodAmount,
                ServiceId = request.ServiceId
            };

            _logger.LogInformation("📦 Calculating shipping from warehouse '{WarehouseName}' to customer in {District}, {Province}",
                warehouseAddress.Name, request.ToAddress.District, request.ToAddress.Province);

            var result = await GetShippingOptionsAsync(standardRequest);
            
            // ✅ Warehouse selection is done silently - customer doesn't need to see this
            // Just log it for admin/debugging purposes
            if (optimalWarehouse != null)
            {
                _logger.LogInformation("✅ Using warehouse '{WarehouseName}' (ID: {WarehouseId}) for shipping calculation",
                    optimalWarehouse.Name, optimalWarehouse.Id);
            }

            return result;
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

        public async Task<UpdateOrderResult> UpdateOrderStatusAsync(int orderId, int updateType, string note)
        {
            try
            {
                // Validate update type
                if (!new[] { 1, 2, 3, 4, 11 }.Contains(updateType))
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Invalid update type. Valid types: 1=Approve, 2=Approve Return, 3=Re-deliver, 4=Cancel, 11=Delete"
                    };
                }

                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Order not found"
                    };
                }

                var shippingRequest = await _shippingRequestRepository.GetByOrderIdAsync(orderId);
                if (shippingRequest == null || string.IsNullOrEmpty(shippingRequest.TrackingCode))
                {
                    return new UpdateOrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "No active shipment found for this order"
                    };
                }

                // ✅ NEW: Validate status for cancel operation (TYPE=4)
                if (updateType == 4 && order.ShippingProvider == ShippingProvider.ViettelPost)
                {
                    // Extract current ViettelPost status code from ShippingStatus
                    var currentStatusCode = ExtractViettelPostStatusCode(order.ShippingStatus, shippingRequest);
                    
                    // According to ViettelPost API specification:
                    // Cancel (TYPE=4) is only allowed when status < 200 and != 105, 107
                    if (currentStatusCode >= 200)
                    {
                        return new UpdateOrderResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"Không thể hủy đơn hàng ở trạng thái hiện tại (status {currentStatusCode}). Chỉ cho phép hủy khi status < 200."
                        };
                    }

                    if (currentStatusCode == 105 || currentStatusCode == 107)
                    {
                        return new UpdateOrderResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"Không thể hủy đơn hàng ở trạng thái {currentStatusCode}. Trạng thái này không cho phép hủy."
                        };
                    }

                    _logger.LogInformation("✅ [CANCEL-VALIDATION] Order {OrderId} with status {Status} is eligible for cancellation", 
                        orderId, currentStatusCode);
                }

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

                // Call provider's UpdateOrderStatusAsync
                var result = await provider.UpdateOrderStatusAsync(shippingRequest.TrackingCode, updateType, note ?? "");

                // Update order status based on update type
                if (result.IsSuccess)
                {
                    switch (updateType)
                    {
                        case 1: // Approve
                            shippingRequest.Status = ShippingStatus.Picked;
                            order.ShippingStatus = ShippingStatus.Picked;
                            break;
                        case 4: // Cancel
                            shippingRequest.Status = ShippingStatus.Cancelled;
                            shippingRequest.CancelledAt = DateTime.UtcNow;
                            shippingRequest.CancelReason = note;
                            order.ShippingStatus = ShippingStatus.Cancelled;
                            break;
                        case 2: // Approve Return
                        case 3: // Re-deliver
                            // Status will be updated via webhook
                            break;
                        case 11: // Delete
                            // Soft delete by marking as cancelled
                            shippingRequest.Status = ShippingStatus.Cancelled;
                            order.ShippingStatus = ShippingStatus.Cancelled;
                            break;
                    }

                    shippingRequest.UpdatedAt = DateTime.UtcNow;
                    order.UpdatedAt = DateTime.UtcNow;

                    await _shippingRequestRepository.UpdateAsync(shippingRequest);
                    await _orderRepository.UpdateAsync(order);
                }

                // Log the transaction
                await LogTransactionAsync(shippingRequest.Id, "UpdateOrderStatus", order.ShippingProvider.ToString(),
                    JsonSerializer.Serialize(new { TrackingCode = shippingRequest.TrackingCode, UpdateType = updateType, Note = note }),
                    JsonSerializer.Serialize(result), null, result.IsSuccess, result.ErrorMessage);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status for order {OrderId}, updateType {UpdateType}", orderId, updateType);
                return new UpdateOrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        public async Task<PrintingCodeResult> GetPrintingCodeAsync(int[] orderIds, long expiryTime)
        {
            try
            {
                if (orderIds == null || orderIds.Length == 0)
                {
                    return new PrintingCodeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Order IDs array cannot be empty"
                    };
                }

                if (orderIds.Length > 100)
                {
                    return new PrintingCodeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Maximum 100 orders allowed per request"
                    };
                }

                _logger.LogInformation("Getting printing code for {Count} orders", orderIds.Length);

                // Get orders and extract tracking codes
                var trackingCodes = new List<string>();
                foreach (var orderId in orderIds)
                {
                    var order = await _orderRepository.GetByIdAsync(orderId);
                    if (order == null)
                    {
                        return new PrintingCodeResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"Order {orderId} not found"
                        };
                    }

                    if (string.IsNullOrEmpty(order.ShippingCode))
                    {
                        return new PrintingCodeResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"Order {orderId} does not have a shipping code"
                        };
                    }

                    if (order.ShippingProvider != ShippingProvider.ViettelPost)
                    {
                        return new PrintingCodeResult
                        {
                            IsSuccess = false,
                            ErrorMessage = $"Order {orderId} is not a ViettelPost order"
                        };
                    }

                    trackingCodes.Add(order.ShippingCode);
                }

                // Get ViettelPost provider
                var provider = _shippingProviders.FirstOrDefault(p => p.Provider == ShippingProvider.ViettelPost);
                if (provider == null)
                {
                    return new PrintingCodeResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "ViettelPost provider not available"
                    };
                }

                // Call provider method
                var result = await provider.GetPrintingCodeAsync(trackingCodes.ToArray(), expiryTime);

                if (result.IsSuccess)
                {
                    _logger.LogInformation("✅ Printing code retrieved successfully for {Count} orders", orderIds.Length);
                }
                else
                {
                    _logger.LogWarning("Failed to get printing code: {Error}", result.ErrorMessage);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting printing code for orders");
                return new PrintingCodeResult
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
                var webhookPayload = JsonSerializer.Deserialize<DTOs.ViettelPostWebhookData>(webhookData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                // ✅ NEW: Check for duplicate webhooks using ViettelPost specification
                if (webhookPayload?.DATA != null)
                {
                    var isDuplicate = await CheckDuplicateWebhookAsync(
                        webhookPayload.DATA.ORDER_STATUS,
                        webhookPayload.DATA.ORDER_STATUSDATE,
                        webhookPayload.DATA.ORDER_NUMBER,
                        webhookPayload.DATA.ORDER_REFERENCE
                    );

                    if (isDuplicate)
                    {
                        _logger.LogInformation("🔄 [DUPLICATE-WEBHOOK] Skipping duplicate webhook for order {OrderNumber}, status {Status}, date {StatusDate}",
                            webhookPayload.DATA.ORDER_NUMBER, webhookPayload.DATA.ORDER_STATUS, webhookPayload.DATA.ORDER_STATUSDATE);
                        return true; // Return success but don't process
                    }
                }

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
                        // ✅ NEW: Check if order is in end state (shouldn't be updated anymore)
                        if (IsEndState(order.ShippingStatus))
                        {
                            _logger.LogInformation("🔒 [END-STATE] Skipping update for order {TrackingCode} - already in end state {CurrentStatus}",
                                webhookInfo.TrackingCode, order.ShippingStatus);
                            isSuccess = true; // Don't treat as error, just skip update
                        }
                        else
                        {
                            // Update shipping status
                            var newStatus = MapStringToShippingStatus(webhookInfo.Status);
                            
                            // ✅ NEW: Check if incoming status is also an end state
                            var incomingStatusCode = int.Parse(webhookInfo.Status);
                            if (IsViettelPostEndState(incomingStatusCode))
                            {
                                _logger.LogInformation("📍 [END-STATE] Updating to final status {Status} for order {TrackingCode}",
                                    incomingStatusCode, webhookInfo.TrackingCode);
                            }
                            
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
                FromAddress = await GetDefaultFromAddressAsync(),
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

        private async Task<ShippingAddressDto> GetDefaultFromAddressAsync()
        {
            // ✅ NEW: Use warehouse service instead of hard-coded config
            var warehouseAddress = await _warehouseService.GetDefaultPickupAddressAsync();
            
            if (warehouseAddress != null)
            {
                return warehouseAddress;
            }

            // ⚠️ FALLBACK: If no warehouse found, use config as emergency fallback
            _logger.LogWarning("No default warehouse found, using config fallback");
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

        /// <summary>
        /// ✅ NEW: Get default warehouse address for e-commerce shipping
        /// </summary>
        private async Task<ShippingAddressDto> GetDefaultWarehouseAddressAsync()
        {
            // Use the new warehouse service method
            return await GetDefaultFromAddressAsync();
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

        public async Task<RegisterInventoryResult> RegisterInventoryAsync(RegisterInventoryRequest request)
        {
            try
            {
                var viettelPostProvider = _shippingProviders.FirstOrDefault(p => p.Provider == ShippingProvider.ViettelPost);
                if (viettelPostProvider == null)
                {
                    return new RegisterInventoryResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "ViettelPost provider không khả dụng",
                        ErrorCode = 500
                    };
                }

                return await viettelPostProvider.RegisterInventoryAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering inventory");
                return new RegisterInventoryResult
                {
                    IsSuccess = false,
                    ErrorMessage = ex.Message,
                    ErrorCode = 500
                };
            }
        }

        /// <summary>
        /// Check if webhook is duplicate using ViettelPost specification key sets
        /// </summary>
        private async Task<bool> CheckDuplicateWebhookAsync(int orderStatus, string? orderStatusDate, string? orderNumber, string? orderReference)
        {
            try
            {
                // Check for duplicate using primary key set: (ORDER_STATUS, ORDER_STATUSDATE, ORDER_NUMBER)
                if (!string.IsNullOrEmpty(orderNumber) && !string.IsNullOrEmpty(orderStatusDate))
                {
                    var existsByOrderNumber = await _dbContext.WebhookLogs
                        .AnyAsync(w => w.OrderStatus == orderStatus 
                                    && w.OrderStatusDate == orderStatusDate 
                                    && w.OrderNumber == orderNumber);
                    
                    if (existsByOrderNumber)
                    {
                        return true;
                    }
                }

                // Check for duplicate using secondary key set: (ORDER_STATUS, ORDER_STATUSDATE, ORDER_REFERENCE)
                if (!string.IsNullOrEmpty(orderReference) && !string.IsNullOrEmpty(orderStatusDate))
                {
                    var existsByOrderReference = await _dbContext.WebhookLogs
                        .AnyAsync(w => w.OrderStatus == orderStatus 
                                    && w.OrderStatusDate == orderStatusDate 
                                    && w.OrderReference == orderReference);
                    
                    if (existsByOrderReference)
                    {
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking duplicate webhook");
                return false; // If check fails, proceed with processing to be safe
            }
        }

        /// <summary>
        /// Check if current shipping status is an end state
        /// </summary>
        private static bool IsEndState(ShippingStatus status)
        {
            return status switch
            {
                ShippingStatus.Delivered => true,
                ShippingStatus.Cancelled => true,
                ShippingStatus.Returned => true,
                _ => false
            };
        }

        /// <summary>
        /// Extract ViettelPost status code from order's shipping history
        /// Used for validation of allowed operations (e.g., cancel only allowed when status < 200)
        /// </summary>
        private int ExtractViettelPostStatusCode(ShippingStatus orderStatus, ShippingRequest shippingRequest)
        {
            try
            {
                // Try to get latest status from shipping history
                if (!string.IsNullOrEmpty(shippingRequest.Order?.ShippingHistory))
                {
                    var history = JsonSerializer.Deserialize<List<TrackingEvent>>(shippingRequest.Order.ShippingHistory);
                    if (history?.Count > 0)
                    {
                        // Get the latest event's status code
                        var latestEvent = history.OrderByDescending(e => e.Timestamp).FirstOrDefault();
                        if (latestEvent != null && int.TryParse(latestEvent.Status, out int statusCode))
                        {
                            return statusCode;
                        }
                    }
                }

                // Fallback: Map ShippingStatus to ViettelPost code
                return orderStatus switch
                {
                    ShippingStatus.PendingPickup => 100,   // Processing
                    ShippingStatus.Picked => 105,          // Picked up by courier
                    ShippingStatus.InTransit => 300,       // In transit
                    ShippingStatus.OutForDelivery => 500,  // Out for delivery
                    ShippingStatus.Delivered => 501,       // Delivered
                    ShippingStatus.Failed => 500,          // Failed delivery - map to out for delivery status
                    ShippingStatus.Returning => 502,       // Being returned
                    ShippingStatus.Returned => 504,        // Returned successfully
                    ShippingStatus.Cancelled => 503,       // Cancelled
                    _ => 100 // Default to processing
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting ViettelPost status code");
                return 100; // Default to safe value
            }
        }

        /// <summary>
        /// Check if ViettelPost status code is an end state according to specification
        /// End states: 501 (delivered), 503 (cancelled), 504 (returned), 201 (cancel note), 107 (partner cancel), -15 (system cancel)
        /// </summary>
        private static bool IsViettelPostEndState(int statusCode)
        {
            return statusCode switch
            {
                // Trạng thái giao hàng thành công
                501 => true,  // Phát thành công - DELIVERED ✅
                504 => true,  // Hoàn thành công - Chuyển trả người gửi - RETURNED ✅
                
                // Trạng thái hủy đơn hàng  
                503 => true,  // Hủy - Theo yêu cầu khách hàng - CANCELLED ✅
                510 => true,  // Hủy giao hàng - CANCELLED ✅
                107 => true,  // Đối tác yêu cầu hủy qua API - CANCELLED ✅
                201 => true,  // Hủy nhập phiếu gửi - CANCELLED ✅
                -15 => true,  // Hệ thống hủy đơn - CANCELLED ✅
                
                // Trạng thái chuyển hoàn
                502 => true,  // Chuyển hoàn bưu cục gốc - RETURNED ✅
                505 => true,  // Phát thất bại - Yêu cầu chuyển hoàn - RETURN_REQUESTED ✅
                
                _ => false
            };
        }
    }
}
