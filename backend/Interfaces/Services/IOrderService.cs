using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync();
        Task<OrderResponseDto?> GetOrderByIdAsync(int id);
        Task<OrderResponseDto?> GetOrderByNumberAsync(string orderNumber);
        Task<OrderResponseDto> CreateOrderAsync(CreateOrderDto createOrderDto);
        Task<OrderResponseDto> CreateOrderByAdminAsync(AdminCreateOrderDto adminCreateOrderDto);
        Task<OrderResponseDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto updateStatusDto);
        Task<bool> DeleteOrderAsync(int id);

        // Filtering and pagination
        Task<OrderListResponseDto> GetFilteredOrdersAsync(OrderFilterDto filter);

        // Customer orders
        Task<IEnumerable<OrderResponseDto>> GetOrdersByCustomerIdAsync(string customerId);

        // Statistics
        Task<OrderStatsDto> GetOrderStatsAsync();

        // Business logic
        Task<bool> CanUpdateOrderStatusAsync(int orderId, OrderStatus newStatus);
        Task<decimal> CalculateOrderTotalAsync(CreateOrderDto createOrderDto);
        Task<bool> ValidateOrderItemsAsync(List<CreateOrderItemDto> items);

        // Admin approval workflow
        Task<OrderResponseDto?> ApproveOrderAsync(int orderId, string adminId);
        Task<OrderResponseDto?> RejectOrderAsync(int orderId, string adminId, string reason);
        Task<IEnumerable<OrderResponseDto>> GetPendingOrdersAsync();

        // Payment processing
        Task<OrderResponseDto> ProcessPaymentAsync(int orderId, string customerId);
        
        // Update payment status based on external webhook (e.g., PayOS)
        Task<OrderResponseDto?> UpdatePaymentStatusFromWebhookAsync(string orderNumber, decimal amount, DateTime paidAt);
    }
}