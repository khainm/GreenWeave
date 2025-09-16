using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetAllAsync();
        Task<Order?> GetByIdAsync(int id);
        Task<Order?> GetByOrderNumberAsync(string orderNumber);
        Task<Order> CreateAsync(Order order);
        Task<Order> UpdateAsync(Order order);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);

        // Filtering and pagination
        Task<(IEnumerable<Order> Orders, int Total)> GetFilteredAsync(
            OrderStatus? status = null,
            string? search = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            string? customerId = null,
            int page = 1,
            int pageSize = 20);

        // Customer orders
        Task<IEnumerable<Order>> GetByCustomerIdAsync(string customerId);

        // Get orders by status
        Task<IEnumerable<Order>> GetOrdersWithStatusAsync(OrderStatus status);

        // Statistics
        Task<int> GetTotalOrdersAsync();
        Task<int> GetOrdersByStatusAsync(OrderStatus status);
        Task<int> GetTodayOrdersAsync();
        Task<decimal> GetTotalRevenueAsync();
        Task<decimal> GetTotalRevenueByDateRangeAsync(DateTime fromDate, DateTime toDate);

        // Order number generation
        Task<string> GenerateOrderNumberAsync();
    }
}