using backend.DTOs;
using backend.Models;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace backend.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserAddressRepository _userAddressRepository;
        private readonly IInvoiceService _invoiceService;
        private readonly IShippingService _shippingService;
        private readonly IEmailService _emailService;
        private readonly IWarehouseSelectionService _warehouseSelectionService;
        private readonly IProductWarehouseStockRepository _productWarehouseStockRepository;
    private readonly ILogger<OrderService> _logger;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<backend.Hubs.StockHub> _stockHubContext;
        private readonly ShippingConfiguration _shippingConfig;
    private readonly OrderSettings _orderSettings;
        
        public OrderService(
            IOrderRepository orderRepository,
            IProductRepository productRepository,
            IUserAddressRepository userAddressRepository,
            IInvoiceService invoiceService,
            IShippingService shippingService,
            IEmailService emailService,
            IWarehouseSelectionService warehouseSelectionService,
            IProductWarehouseStockRepository productWarehouseStockRepository,
            ILogger<OrderService> logger,
            IOptions<ShippingConfiguration> shippingConfig,
            IOptions<OrderSettings> orderSettings,
            Microsoft.AspNetCore.SignalR.IHubContext<backend.Hubs.StockHub> stockHubContext)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _userAddressRepository = userAddressRepository;
            _invoiceService = invoiceService;
            _shippingService = shippingService;
            _emailService = emailService;
            _warehouseSelectionService = warehouseSelectionService;
            _productWarehouseStockRepository = productWarehouseStockRepository;
            _logger = logger;
            _shippingConfig = shippingConfig.Value;
            _orderSettings = orderSettings?.Value ?? new OrderSettings();
            _stockHubContext = stockHubContext;
        }
        
        public async Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync()
        {
            var orders = await _orderRepository.GetAllAsync();
            return orders.Select(MapToResponseDto);
        }
        
        public async Task<OrderResponseDto?> GetOrderByIdAsync(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            return order != null ? MapToResponseDto(order) : null;
        }

        public async Task<OrderResponseDto?> GetOrderByNumberAsync(string orderNumber)
        {
            var order = await _orderRepository.GetByOrderNumberAsync(orderNumber);
            return order != null ? MapToResponseDto(order) : null;
        }
        
        public async Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto createOrderDto)
        {
            try
            {
                _logger.LogInformation("Creating order in Production mode");

                // Validate order items
                if (!await ValidateOrderItemsAsync(createOrderDto.Items))
                {
                    throw new ArgumentException("Một hoặc nhiều sản phẩm không hợp lệ");
                }

                // Validate shipping address
                var shippingAddress = await _userAddressRepository.GetAddressByIdAsync(
                    Guid.Parse(createOrderDto.ShippingAddressId.ToString()), 
                    createOrderDto.CustomerId);
                if (shippingAddress == null)
                {
                    throw new ArgumentException("Địa chỉ giao hàng không hợp lệ");
                }

                // Calculate totals
                var subtotal = await CalculateSubtotalAsync(createOrderDto.Items);
                var total = subtotal + createOrderDto.ShippingFee - createOrderDto.Discount;

                // Select optimal warehouse for order fulfillment
                var shippingAddressDto = new UserAddressDto
                {
                    Province = shippingAddress.Province,
                    District = shippingAddress.District,
                    Ward = shippingAddress.Ward,
                    AddressLine = shippingAddress.AddressLine
                };
                
                var selectedWarehouse = await _warehouseSelectionService.SelectOptimalWarehouseAsync(
                    createOrderDto.Items, shippingAddressDto);

                if (selectedWarehouse == null)
                {
                    throw new InvalidOperationException("Không có kho nào đủ hàng để thực hiện đơn hàng này");
                }

                _logger.LogInformation("Selected warehouse {WarehouseName} (ID: {WarehouseId}) for new order", 
                    selectedWarehouse.WarehouseName, selectedWarehouse.WarehouseId);

                // Generate order number
                var orderNumber = await _orderRepository.GenerateOrderNumberAsync();

                // Create order
                var order = new Order
                {
                    OrderNumber = orderNumber,
                    CustomerId = createOrderDto.CustomerId,
                    ShippingAddressId = createOrderDto.ShippingAddressId,
                    Subtotal = subtotal,
                    ShippingFee = createOrderDto.ShippingFee,
                    Discount = createOrderDto.Discount,
                    Total = total,
                    Status = OrderStatus.Pending,
                    PaymentMethod = createOrderDto.PaymentMethod,
                    PaymentStatus = createOrderDto.PaymentMethod == PaymentMethod.BankTransfer 
                        ? PaymentStatus.Pending 
                        : PaymentStatus.Pending, // COD cũng là pending cho đến khi giao hàng
                    FulfillmentWarehouseId = selectedWarehouse.WarehouseId,
                    FulfillmentWarehouseName = selectedWarehouse.WarehouseName,
                    Notes = createOrderDto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Create order items
                foreach (var itemDto in createOrderDto.Items)
                {
                    var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                    if (product == null) continue;

                    var orderItem = new OrderItem
                    {
                        ProductId = itemDto.ProductId,
                        ProductName = product.Name,
                        ProductSku = product.Sku,
                        ProductImage = product.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.UnitPrice * itemDto.Quantity,
                        CustomizationData = itemDto.Customization != null ? JsonSerializer.Serialize(itemDto.Customization) : null
                    };

                    order.Items.Add(orderItem);
                }

                var createdOrder = await _orderRepository.CreateAsync(order);
                
                // Reserve stock for the order
                await ReserveStockForOrderAsync(createdOrder.Id, createOrderDto.Items, selectedWarehouse.WarehouseId);
                
                return MapToResponseDto(createdOrder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                throw;
            }
        }

        public async Task<OrderResponseDto> CreateOrderByAdminAsync(AdminCreateOrderDto adminCreateOrderDto)
        {
            try
            {
                _logger.LogInformation("Creating order by admin");

                // Validate order items
                if (!await ValidateOrderItemsAsync(adminCreateOrderDto.Items))
                {
                    throw new ArgumentException("Một hoặc nhiều sản phẩm không hợp lệ");
                }

                // Create or find customer
                var customerId = await CreateOrFindCustomerAsync(adminCreateOrderDto.CustomerInfo);

                // Create shipping address
                var shippingAddressId = await CreateShippingAddressAsync(customerId, adminCreateOrderDto.ShippingAddress);

                // Calculate totals
                var subtotal = await CalculateSubtotalAsync(adminCreateOrderDto.Items);
                var total = subtotal + adminCreateOrderDto.ShippingFee - adminCreateOrderDto.Discount;

                // Select optimal warehouse for order fulfillment
                var shippingAddressDto = new UserAddressDto
                {
                    Province = adminCreateOrderDto.ShippingAddress.Province,
                    District = adminCreateOrderDto.ShippingAddress.District,
                    Ward = adminCreateOrderDto.ShippingAddress.Ward,
                    AddressLine = adminCreateOrderDto.ShippingAddress.AddressLine
                };

                var selectedWarehouse = await _warehouseSelectionService.SelectOptimalWarehouseAsync(
                    adminCreateOrderDto.Items, shippingAddressDto);

                if (selectedWarehouse == null)
                {
                    throw new ArgumentException("Không tìm thấy kho phù hợp để thực hiện đơn hàng");
                }

                // Generate order number
                var orderNumber = await _orderRepository.GenerateOrderNumberAsync();

                // Create order
                var order = new Order
                {
                    OrderNumber = orderNumber,
                    CustomerId = customerId,
                    ShippingAddressId = shippingAddressId,
                    Subtotal = subtotal,
                    ShippingFee = adminCreateOrderDto.ShippingFee,
                    Discount = adminCreateOrderDto.Discount,
                    Total = total,
                    Status = OrderStatus.Pending,
                    PaymentMethod = adminCreateOrderDto.PaymentMethod,
                    PaymentStatus = adminCreateOrderDto.PaymentMethod == PaymentMethod.BankTransfer 
                        ? PaymentStatus.Pending 
                        : PaymentStatus.Pending, // COD cũng là pending cho đến khi giao hàng
                    FulfillmentWarehouseId = selectedWarehouse.WarehouseId,
                    FulfillmentWarehouseName = selectedWarehouse.WarehouseName,
                    Notes = adminCreateOrderDto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Create order items
                foreach (var itemDto in adminCreateOrderDto.Items)
                {
                    var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                    if (product == null) continue;

                    var orderItem = new OrderItem
                    {
                        ProductId = itemDto.ProductId,
                        ProductName = product.Name,
                        ProductSku = product.Sku,
                        ProductImage = product.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.UnitPrice * itemDto.Quantity,
                        CustomizationData = itemDto.Customization != null ? JsonSerializer.Serialize(itemDto.Customization) : null
                    };

                    order.Items.Add(orderItem);
                }

                var createdOrder = await _orderRepository.CreateAsync(order);
                
                // Reserve stock for the order
                await ReserveStockForOrderAsync(createdOrder.Id, adminCreateOrderDto.Items, selectedWarehouse.WarehouseId);
                
                return MapToResponseDto(createdOrder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order by admin");
                throw;
            }
        }

        private Task<string> CreateOrFindCustomerAsync(AdminCustomerInfoDto customerInfo)
        {
            // For now, create a temporary customer ID
            // In a real system, you might want to create a customer record
            return Task.FromResult($"temp-customer-{Guid.NewGuid()}");
        }

        private async Task<Guid> CreateShippingAddressAsync(string customerId, AdminShippingAddressDto shippingAddress)
        {
            // Create a temporary address
            var address = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = customerId,
                FullName = shippingAddress.FullName,
                PhoneNumber = shippingAddress.Phone,
                Province = shippingAddress.Province,
                District = shippingAddress.District,
                Ward = shippingAddress.Ward,
                AddressLine = shippingAddress.AddressLine,
                IsDefault = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userAddressRepository.CreateAddressAsync(address);
            return address.Id;
        }
        
        public async Task<OrderResponseDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto updateStatusDto)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(id);
                if (order == null)
                {
                    throw new ArgumentException("Không tìm thấy đơn hàng");
                }

                if (!await CanUpdateOrderStatusAsync(id, updateStatusDto.Status))
                {
                    throw new ArgumentException("Không thể cập nhật trạng thái đơn hàng này");
                }

                var previousStatus = order.Status;
                order.Status = updateStatusDto.Status;
                order.UpdatedAt = DateTime.UtcNow;
                order.Notes = updateStatusDto.Notes;

                // Update status timestamps
                switch (updateStatusDto.Status)
                {
                    case OrderStatus.Confirmed:
                        order.ConfirmedAt = DateTime.UtcNow;
                        break;
                    case OrderStatus.Shipping:
                        order.ShippedAt = DateTime.UtcNow;
                        break;
                    case OrderStatus.Delivered:
                        order.DeliveredAt = DateTime.UtcNow;
                        break;
                    case OrderStatus.Cancelled:
                        order.CancelledAt = DateTime.UtcNow;
                        order.CancelReason = updateStatusDto.Notes;
                        // Return reserved stock when order is cancelled
                        await ReturnReservedStockForCancelledOrderAsync(id);
                        break;
                }

                var updatedOrder = await _orderRepository.UpdateAsync(order);

                // Tự động tạo shipment và invoice khi xác nhận đơn hàng
                if (updateStatusDto.Status == OrderStatus.Confirmed && previousStatus != OrderStatus.Confirmed)
                {
                    try
                    {
                        _logger.LogInformation("Processing confirmed order: {OrderId}", id);
                        
                        // 1. Reduce actual stock when order is confirmed
                        await ReduceStockForConfirmedOrderAsync(id);
                        
                        // 2. Tạo shipment với ViettelPost
                        if (order.ShippingRequest != null)
                        {
                            _logger.LogInformation("Creating shipment for order: {OrderId}", id);
                            var shipmentResult = await _shippingService.CreateShipmentAsync(new CreateShipmentRequest
                            {
                                OrderId = id,
                                Provider = order.ShippingProvider,
                                ServiceId = order.ShippingRequest.ServiceId,
                                Note = order.Notes
                            });
                            
                            if (shipmentResult.IsSuccess)
                            {
                                _logger.LogInformation("Shipment created successfully for order: {OrderId}, Tracking: {TrackingCode}", 
                                    id, shipmentResult.TrackingCode);
                            }
                            else
                            {
                                _logger.LogWarning("Failed to create shipment for order: {OrderId}, Error: {Error}", 
                                    id, shipmentResult.ErrorMessage);
                            }
                        }
                        
                        // 3. Tạo và gửi invoice
                        _logger.LogInformation("Creating invoice for confirmed order: {OrderId}", id);
                        await _invoiceService.ProcessOrderConfirmationAsync(id);
                        _logger.LogInformation("Invoice created and sent successfully for order: {OrderId}", id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process confirmed order: {OrderId}", id);
                        // Không throw exception để không ảnh hưởng đến việc cập nhật trạng thái đơn hàng
                    }
                }

                // Đồng bộ với ViettelPost khi đơn hàng đã được tạo và có thay đổi thông tin
                if (order.ShippingRequest != null && !string.IsNullOrEmpty(order.ShippingCode))
                {
                    try
                    {
                        _logger.LogInformation("Syncing order changes with ViettelPost for order: {OrderId}", id);
                        
                        var updateRequest = new UpdateOrderRequest
                        {
                            FromAddress = JsonSerializer.Deserialize<ShippingAddressDto>(order.ShippingRequest.FromAddress) ?? new(),
                            ToAddress = JsonSerializer.Deserialize<ShippingAddressDto>(order.ShippingRequest.ToAddress) ?? new(),
                            Note = order.Notes,
                            CodAmount = order.ShippingRequest.CodAmount
                        };

                        var updateResult = await _shippingService.UpdateOrderAsync(id, updateRequest);
                        
                        if (updateResult.IsSuccess)
                        {
                            _logger.LogInformation("Order synced successfully with ViettelPost for order: {OrderId}", id);
                        }
                        else
                        {
                            _logger.LogWarning("Failed to sync order with ViettelPost for order: {OrderId}, Error: {Error}", 
                                id, updateResult.ErrorMessage);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error syncing order with ViettelPost for order: {OrderId}", id);
                        // Không throw exception để không ảnh hưởng đến việc cập nhật trạng thái đơn hàng
                    }
                }

                // Gửi email thông báo cập nhật trạng thái (trừ trường hợp confirmed vì đã gửi trong invoice)
                if (updateStatusDto.Status != OrderStatus.Confirmed)
                {
                    try
                    {
                        await _emailService.SendOrderStatusUpdateEmailAsync(
                            updatedOrder.Customer.Email ?? string.Empty,
                            updatedOrder.Customer.FullName ?? updatedOrder.Customer.Email ?? string.Empty,
                            updatedOrder.OrderNumber,
                            updateStatusDto.Status.ToString().ToLower()
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send status update email for order: {OrderId}", id);
                        // Không throw exception
                    }
                }

                return MapToResponseDto(updatedOrder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status for order {OrderId}", id);
                throw;
            }
        }
        
        public async Task<bool> DeleteOrderAsync(int id)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(id);
                if (order == null) return false;

                // Only allow deletion of pending orders
                if (order.Status != OrderStatus.Pending)
                {
                    throw new InvalidOperationException("Chỉ có thể xóa đơn hàng ở trạng thái chờ xác nhận");
                }

                return await _orderRepository.DeleteAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order {OrderId}", id);
                throw;
            }
        }

        public async Task<OrderListResponseDto> GetFilteredOrdersAsync(OrderFilterDto filter)
        {
            try
            {
                var (orders, total) = await _orderRepository.GetFilteredAsync(
                    filter.Status,
                    filter.Search,
                    filter.DateFrom,
                    filter.DateTo,
                    filter.CustomerId,
                    filter.Page,
                    filter.PageSize);

                var totalPages = (int)Math.Ceiling((double)total / filter.PageSize);

                return new OrderListResponseDto
                {
                    Orders = orders.Select(MapToResponseDto).ToList(),
                    Total = total,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered orders");
                throw;
            }
        }

        public async Task<IEnumerable<OrderResponseDto>> GetOrdersByCustomerIdAsync(string customerId)
        {
            var orders = await _orderRepository.GetByCustomerIdAsync(customerId);
            return orders.Select(MapToResponseDto);
        }

        public async Task<OrderStatsDto> GetOrderStatsAsync()
        {
            try
            {
                var totalOrders = await _orderRepository.GetTotalOrdersAsync();
                var pendingOrders = await _orderRepository.GetOrdersByStatusAsync(OrderStatus.Pending);
                var processingOrders = await _orderRepository.GetOrdersByStatusAsync(OrderStatus.Processing);
                var shippingOrders = await _orderRepository.GetOrdersByStatusAsync(OrderStatus.Shipping);
                var deliveredOrders = await _orderRepository.GetOrdersByStatusAsync(OrderStatus.Delivered);
                var cancelledOrders = await _orderRepository.GetOrdersByStatusAsync(OrderStatus.Cancelled);
                var totalRevenue = await _orderRepository.GetTotalRevenueAsync();
                var todayOrders = await _orderRepository.GetTodayOrdersAsync();

                return new OrderStatsDto
                {
                    TotalOrders = totalOrders,
                    PendingOrders = pendingOrders,
                    ProcessingOrders = processingOrders,
                    ShippingOrders = shippingOrders,
                    DeliveredOrders = deliveredOrders,
                    CancelledOrders = cancelledOrders,
                    TotalRevenue = totalRevenue,
                    TodayOrders = todayOrders
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order statistics");
                throw;
            }
        }

        public async Task<bool> CanUpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null) return false;

                var currentStatus = order.Status;

                // Define valid status transitions
                var validTransitions = new Dictionary<OrderStatus, List<OrderStatus>>
                {
                    { OrderStatus.Pending, new List<OrderStatus> { OrderStatus.Confirmed, OrderStatus.Cancelled } },
                    { OrderStatus.Confirmed, new List<OrderStatus> { OrderStatus.Processing, OrderStatus.Cancelled } },
                    { OrderStatus.Processing, new List<OrderStatus> { OrderStatus.Shipping, OrderStatus.Cancelled } },
                    { OrderStatus.Shipping, new List<OrderStatus> { OrderStatus.Delivered, OrderStatus.Returned } },
                    { OrderStatus.Delivered, new List<OrderStatus> { OrderStatus.Returned } },
                    { OrderStatus.Cancelled, new List<OrderStatus>() },
                    { OrderStatus.Returned, new List<OrderStatus>() }
                };

                return validTransitions.ContainsKey(currentStatus) && 
                       validTransitions[currentStatus].Contains(newStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if order status can be updated");
                return false;
            }
        }

        public async Task<decimal> CalculateOrderTotalAsync(CreateOrderDto createOrderDto)
        {
            var subtotal = await CalculateSubtotalAsync(createOrderDto.Items);
            return subtotal + createOrderDto.ShippingFee - createOrderDto.Discount;
        }

        public async Task<bool> ValidateOrderItemsAsync(List<CreateOrderItemDto> items)
        {
            try
            {
                foreach (var item in items)
                {
                    var product = await _productRepository.GetByIdAsync(item.ProductId);
                    if (product == null || product.Status != "active")
                    {
                        return false;
                    }

                    if (product.Stock < item.Quantity)
                    {
                        return false;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating order items");
                return false;
            }
        }

        private async Task<decimal> CalculateSubtotalAsync(List<CreateOrderItemDto> items)
        {
            decimal subtotal = 0;
            
            foreach (var item in items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    subtotal += item.UnitPrice * item.Quantity;
                }
            }

            return subtotal;
        }

        private static OrderResponseDto MapToResponseDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                Customer = new CustomerInfoDto
                {
                    Id = order.Customer.Id,
                    Email = order.Customer.Email ?? string.Empty,
                    FullName = order.Customer.FullName,
                    PhoneNumber = order.Customer.PhoneNumber
                },
                ShippingAddress = new UserAddressDto
                {
                    Id = order.ShippingAddress.Id,
                    FullName = order.ShippingAddress.FullName,
                    PhoneNumber = order.ShippingAddress.PhoneNumber,
                    AddressLine = order.ShippingAddress.AddressLine,
                    Ward = order.ShippingAddress.Ward ?? string.Empty,
                    District = order.ShippingAddress.District,
                    Province = order.ShippingAddress.Province,
                    IsDefault = order.ShippingAddress.IsDefault
                },
                Items = order.Items.Select(item => new OrderItemResponseDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    ProductSku = item.ProductSku,
                    ProductImage = item.ProductImage,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice,
                    Customization = !string.IsNullOrEmpty(item.CustomizationData) 
                        ? JsonSerializer.Deserialize<object>(item.CustomizationData) 
                        : null
                }).ToList(),
                Subtotal = order.Subtotal,
                ShippingFee = order.ShippingFee,
                Discount = order.Discount,
                Total = order.Total,
                Status = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                PaymentMethod = order.PaymentMethod.ToString(),
                FulfillmentWarehouseId = order.FulfillmentWarehouseId?.ToString(),
                FulfillmentWarehouseName = order.FulfillmentWarehouseName,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                ConfirmedAt = order.ConfirmedAt,
                PaidAt = order.PaidAt,
                ShippedAt = order.ShippedAt,
                DeliveredAt = order.DeliveredAt,
                CancelledAt = order.CancelledAt,
                CancelReason = order.CancelReason,
                ApprovedBy = order.ApprovedBy,
                ApprovedAt = order.ApprovedAt
            };
        }

        // Admin approval workflow methods
        public async Task<OrderResponseDto?> ApproveOrderAsync(int orderId, string adminId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;

            // Only allow approval of pending orders
            if (order.Status != OrderStatus.Pending)
            {
                throw new InvalidOperationException($"Không thể duyệt đơn hàng với trạng thái {order.Status}");
            }

            order.Status = OrderStatus.Confirmed;
            order.ApprovedBy = adminId;
            order.ApprovedAt = DateTime.UtcNow;
            order.ConfirmedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            var updatedOrder = await _orderRepository.UpdateAsync(order);
            
            // TODO: Send confirmation email to customer
            // try
            // {
            //     await _emailService.SendOrderConfirmationAsync(updatedOrder);
            // }
            // catch (Exception ex)
            // {
            //     _logger.LogError(ex, "Failed to send order confirmation email for order {OrderId}", orderId);
            // }

            return MapToResponseDto(updatedOrder);
        }

        public async Task<OrderResponseDto?> RejectOrderAsync(int orderId, string adminId, string reason)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;

            // Only allow rejection of pending orders
            if (order.Status != OrderStatus.Pending)
            {
                throw new InvalidOperationException($"Không thể từ chối đơn hàng với trạng thái {order.Status}");
            }

            order.Status = OrderStatus.Cancelled;
            order.ApprovedBy = adminId;
            order.ApprovedAt = DateTime.UtcNow;
            order.CancelledAt = DateTime.UtcNow;
            order.CancelReason = reason;
            order.UpdatedAt = DateTime.UtcNow;

            var updatedOrder = await _orderRepository.UpdateAsync(order);

            // TODO: Send rejection email to customer
            // try
            // {
            //     await _emailService.SendOrderRejectionAsync(updatedOrder, reason);
            // }
            // catch (Exception ex)
            // {
            //     _logger.LogError(ex, "Failed to send order rejection email for order {OrderId}", orderId);
            // }

            return MapToResponseDto(updatedOrder);
        }

        public async Task<IEnumerable<OrderResponseDto>> GetPendingOrdersAsync()
        {
            var orders = await _orderRepository.GetOrdersWithStatusAsync(OrderStatus.Pending);
            return orders.Select(MapToResponseDto);
        }

        public async Task<OrderResponseDto> ProcessPaymentAsync(int orderId, string customerId)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    throw new ArgumentException("Không tìm thấy đơn hàng");
                }

                // Kiểm tra quyền sở hữu đơn hàng
                if (order.CustomerId != customerId)
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền thanh toán đơn hàng này");
                }

                // Kiểm tra trạng thái đơn hàng
                if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Returned)
                {
                    throw new ArgumentException("Không thể thanh toán đơn hàng đã hủy hoặc đã trả");
                }

                // Kiểm tra trạng thái thanh toán
                if (order.PaymentStatus == PaymentStatus.Paid)
                {
                    throw new ArgumentException("Đơn hàng đã được thanh toán");
                }

                // Cập nhật trạng thái thanh toán
                order.PaymentStatus = PaymentStatus.Paid;
                order.PaidAt = DateTime.UtcNow;
                order.UpdatedAt = DateTime.UtcNow;

                await _orderRepository.UpdateAsync(order);

                _logger.LogInformation("Payment processed successfully for order: {OrderId}", orderId);

                // Nếu cấu hình bật auto-confirm, chuyển đơn sang Confirmed và reduce stock
                var paymentMethodName = order.PaymentMethod.ToString();
                var canAutoConfirmForMethod = _orderSettings.AutoConfirmPaymentMethods != null &&
                                              _orderSettings.AutoConfirmPaymentMethods.Contains(paymentMethodName);

                if (_orderSettings.AutoConfirmOnPayment && order.Status == OrderStatus.Pending && canAutoConfirmForMethod)
                {
                    try
                    {
                        _logger.LogInformation("Auto-confirming order {OrderId} after payment", orderId);
                        // Update order status to Confirmed
                        order.Status = OrderStatus.Confirmed;
                        order.ConfirmedAt = DateTime.UtcNow;
                        order.UpdatedAt = DateTime.UtcNow;
                        var updatedOrder = await _orderRepository.UpdateAsync(order);

                        // Reduce stock for confirmed order (this method updates product totals)
                        await ReduceStockForConfirmedOrderAsync(orderId);

                        // Create invoice and shipment as in UpdateOrderStatusAsync
                        try
                        {
                            await _invoiceService.ProcessOrderConfirmationAsync(orderId);
                        }
                        catch (Exception exInv)
                        {
                            _logger.LogError(exInv, "Failed to create invoice during auto-confirm for order {OrderId}", orderId);
                        }
                    }
                    catch (Exception exAuto)
                    {
                        // If auto-confirm fails (e.g., not enough reserved stock), mark Processing and notify via logs
                        _logger.LogError(exAuto, "Auto-confirm failed for order {OrderId}. Marking as Processing for manual review.", orderId);
                        order.Status = OrderStatus.Processing;
                        order.UpdatedAt = DateTime.UtcNow;
                        await _orderRepository.UpdateAsync(order);
                    }
                }

                return MapToResponseDto(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment for order: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<OrderResponseDto?> UpdatePaymentStatusFromWebhookAsync(string orderNumber, decimal amount, DateTime paidAt)
        {
            try
            {
                var order = await _orderRepository.GetByOrderNumberAsync(orderNumber);
                if (order == null)
                {
                    _logger.LogWarning("Webhook attempted to update payment for unknown order: {OrderNumber}", orderNumber);
                    return null;
                }

                // If already paid, return current state
                if (order.PaymentStatus == PaymentStatus.Paid)
                {
                    _logger.LogInformation("Order {OrderNumber} already marked as paid", orderNumber);
                    return MapToResponseDto(order);
                }

                // Optional: verify amount matches expected total
                if (amount != order.Total)
                {
                    _logger.LogWarning("Payment amount {Amount} for order {OrderNumber} does not match order total {Total}", amount, orderNumber, order.Total);
                    // Continue marking as paid to avoid blocking shipments; alternatively you could reject or flag the order.
                }

                order.PaymentStatus = PaymentStatus.Paid;
                order.PaidAt = paidAt;
                order.UpdatedAt = DateTime.UtcNow;

                var updated = await _orderRepository.UpdateAsync(order);

                // Run the same auto-confirm flow if enabled for the payment method
                var paymentMethodName = order.PaymentMethod.ToString();
                var canAutoConfirmForMethod = _orderSettings.AutoConfirmPaymentMethods != null &&
                                              _orderSettings.AutoConfirmPaymentMethods.Contains(paymentMethodName);

                if (_orderSettings.AutoConfirmOnPayment && order.Status == OrderStatus.Pending && canAutoConfirmForMethod)
                {
                    try
                    {
                        _logger.LogInformation("Auto-confirming order {OrderNumber} after webhook payment", orderNumber);
                        order.Status = OrderStatus.Confirmed;
                        order.ConfirmedAt = DateTime.UtcNow;
                        order.UpdatedAt = DateTime.UtcNow;
                        await _orderRepository.UpdateAsync(order);

                        // Reduce stock and create invoice/shipments similar to existing code
                        await ReduceStockForConfirmedOrderAsync(order.Id);
                        try
                        {
                            await _invoiceService.ProcessOrderConfirmationAsync(order.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to create invoice during auto-confirm for order {OrderNumber}", orderNumber);
                        }
                    }
                    catch (Exception exAuto)
                    {
                        _logger.LogError(exAuto, "Auto-confirm failed for order {OrderNumber}. Marking as Processing for manual review.", orderNumber);
                        order.Status = OrderStatus.Processing;
                        order.UpdatedAt = DateTime.UtcNow;
                        await _orderRepository.UpdateAsync(order);
                    }
                }

                return MapToResponseDto(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status from webhook for order {OrderNumber}", orderNumber);
                throw;
            }
        }

        /// <summary>
        /// Get shipping provider (always ViettelPost in production)
        /// </summary>
        private ShippingProvider GetShippingProvider()
        {
            _logger.LogInformation("Using ViettelPost in Production mode");
            return ShippingProvider.ViettelPost;
        }

        /// <summary>
        /// Reserve stock for order items when order is created
        /// </summary>
        private async Task ReserveStockForOrderAsync(int orderId, List<CreateOrderItemDto> items, Guid warehouseId)
        {
            try
            {
                _logger.LogInformation("Reserving stock for order {OrderId} in warehouse {WarehouseId}", orderId, warehouseId);
                
                foreach (var item in items)
                {
                    var warehouseStock = await _productWarehouseStockRepository.GetByProductAndWarehouseAsync(item.ProductId, warehouseId);
                    if (warehouseStock != null)
                    {
                        // Check if enough stock is available
                        if (warehouseStock.AvailableStock >= item.Quantity)
                        {
                            // Reserve the stock
                            warehouseStock.ReservedStock += item.Quantity;
                            await _productWarehouseStockRepository.UpdateAsync(warehouseStock);
                            
                            _logger.LogInformation("Reserved {Quantity} units of product {ProductId} for order {OrderId}", 
                                item.Quantity, item.ProductId, orderId);
                            // Broadcast stock change
                            try
                            {
                                var payload = new { productId = item.ProductId, availableStock = warehouseStock.AvailableStock };
                                await _stockHubContext.Clients.All.SendCoreAsync("StockChanged", new object[] { payload });
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to broadcast stock change for product {ProductId}", item.ProductId);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("Insufficient stock for product {ProductId} in warehouse {WarehouseId}. Available: {Available}, Required: {Required}", 
                                item.ProductId, warehouseId, warehouseStock.AvailableStock, item.Quantity);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No warehouse stock found for product {ProductId} in warehouse {WarehouseId}", 
                            item.ProductId, warehouseId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reserving stock for order {OrderId}", orderId);
                throw;
            }
        }

        /// <summary>
        /// Reduce actual stock when order is confirmed
        /// </summary>
        private async Task ReduceStockForConfirmedOrderAsync(int orderId)
        {
            try
            {
                _logger.LogInformation("Reducing stock for confirmed order {OrderId}", orderId);
                
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null) return;

                foreach (var item in order.Items)
                {
                    // Find the warehouse stock for this product
                    var warehouseStocks = await _productWarehouseStockRepository.GetByProductIdAsync(item.ProductId);
                    
                    foreach (var warehouseStock in warehouseStocks)
                    {
                        if (warehouseStock.ReservedStock >= item.Quantity)
                        {
                            // Reduce both actual stock and reserved stock
                            warehouseStock.Stock -= item.Quantity;
                            warehouseStock.ReservedStock -= item.Quantity;
                            await _productWarehouseStockRepository.UpdateAsync(warehouseStock);
                            
                            _logger.LogInformation("Reduced stock for product {ProductId} in warehouse {WarehouseId}: Stock -{Quantity}, Reserved -{Quantity}", 
                                item.ProductId, warehouseStock.WarehouseId, item.Quantity, item.Quantity);
                            // Broadcast stock change
                            try
                            {
                                var payload = new { productId = item.ProductId, availableStock = warehouseStock.AvailableStock };
                                await _stockHubContext.Clients.All.SendCoreAsync("StockChanged", new object[] { payload });
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to broadcast stock change for product {ProductId}", item.ProductId);
                            }
                            break;
                        }
                    }
                }

                // Update total stock in products
                await UpdateProductTotalStockAsync(order.Items.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reducing stock for confirmed order {OrderId}", orderId);
                throw;
            }
        }

        /// <summary>
        /// Return reserved stock when order is cancelled
        /// </summary>
        private async Task ReturnReservedStockForCancelledOrderAsync(int orderId)
        {
            try
            {
                _logger.LogInformation("Returning reserved stock for cancelled order {OrderId}", orderId);
                
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null) return;

                foreach (var item in order.Items)
                {
                    // Find the warehouse stock for this product
                    var warehouseStocks = await _productWarehouseStockRepository.GetByProductIdAsync(item.ProductId);
                    
                    foreach (var warehouseStock in warehouseStocks)
                    {
                        if (warehouseStock.ReservedStock >= item.Quantity)
                        {
                            // Return reserved stock to available stock
                            warehouseStock.ReservedStock -= item.Quantity;
                            await _productWarehouseStockRepository.UpdateAsync(warehouseStock);
                            
                            _logger.LogInformation("Returned reserved stock for product {ProductId} in warehouse {WarehouseId}: Reserved -{Quantity}", 
                                item.ProductId, warehouseStock.WarehouseId, item.Quantity);
                                // Broadcast stock change
                                try
                                {
                                    var payload = new { productId = item.ProductId, availableStock = warehouseStock.AvailableStock };
                                    await _stockHubContext.Clients.All.SendCoreAsync("StockChanged", new object[] { payload });
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogWarning(ex, "Failed to broadcast stock change for product {ProductId}", item.ProductId);
                                }
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error returning reserved stock for cancelled order {OrderId}", orderId);
                throw;
            }
        }

        /// <summary>
        /// Update total stock in products after warehouse stock changes
        /// </summary>
        private async Task UpdateProductTotalStockAsync(List<OrderItem> orderItems)
        {
            try
            {
                var productIds = orderItems.Select(item => item.ProductId).Distinct();
                
                foreach (var productId in productIds)
                {
                    var totalStock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(productId);
                    var product = await _productRepository.GetByIdAsync(productId);
                    
                    if (product != null)
                    {
                        product.Stock = totalStock;
                        await _productRepository.UpdateAsync(product);
                        
                        _logger.LogInformation("Updated total stock for product {ProductId}: {TotalStock}", productId, totalStock);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product total stock");
                throw;
            }
        }
    }
}