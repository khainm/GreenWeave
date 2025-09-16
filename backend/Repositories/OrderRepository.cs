using backend.Models;
using backend.Data;
using backend.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrderRepository> _logger;
        
        public OrderRepository(ApplicationDbContext context, ILogger<OrderRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        public async Task<IEnumerable<Order>> GetAllAsync()
        {
            try
            {
                return await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all orders");
                throw;
            }
        }
        
        public async Task<Order?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(o => o.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by id: {Id}", id);
                throw;
            }
        }

        public async Task<Order?> GetByOrderNumberAsync(string orderNumber)
        {
            try
            {
                return await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by number: {OrderNumber}", orderNumber);
                throw;
            }
        }
        
        public async Task<Order> CreateAsync(Order order)
        {
            try
            {
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
                
                // Reload the order with navigation properties
                return await GetByIdAsync(order.Id) ?? order;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                throw;
            }
        }
        
        public async Task<Order> UpdateAsync(Order order)
        {
            try
            {
                order.UpdatedAt = DateTime.UtcNow;
                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
                return order;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order: {Id}", order.Id);
                throw;
            }
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null) return false;
                
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order: {Id}", id);
                throw;
            }
        }
        
        public async Task<bool> ExistsAsync(int id)
        {
            try
            {
                return await _context.Orders.AnyAsync(o => o.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if order exists: {Id}", id);
                throw;
            }
        }

        public async Task<(IEnumerable<Order> Orders, int Total)> GetFilteredAsync(
            OrderStatus? status = null,
            string? search = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            string? customerId = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                var query = _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .AsQueryable();

                // Apply filters
                if (status.HasValue)
                {
                    query = query.Where(o => o.Status == status.Value);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(o => 
                        o.OrderNumber.Contains(search) ||
                        o.Customer.FullName.Contains(search) ||
                        o.Customer.Email.Contains(search));
                }

                if (dateFrom.HasValue)
                {
                    query = query.Where(o => o.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    var endOfDay = dateTo.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(o => o.CreatedAt <= endOfDay);
                }

                if (!string.IsNullOrEmpty(customerId))
                {
                    query = query.Where(o => o.CustomerId == customerId);
                }

                var total = await query.CountAsync();

                var orders = await query
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (orders, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered orders");
                throw;
            }
        }

        public async Task<IEnumerable<Order>> GetByCustomerIdAsync(string customerId)
        {
            try
            {
                return await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .Where(o => o.CustomerId == customerId)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders for customer: {CustomerId}", customerId);
                throw;
            }
        }

        public async Task<IEnumerable<Order>> GetOrdersWithStatusAsync(OrderStatus status)
        {
            try
            {
                return await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.ShippingAddress)
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                    .Where(o => o.Status == status)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders with status: {Status}", status);
                throw;
            }
        }

        public async Task<int> GetTotalOrdersAsync()
        {
            try
            {
                return await _context.Orders.CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting total orders count");
                throw;
            }
        }

        public async Task<int> GetOrdersByStatusAsync(OrderStatus status)
        {
            try
            {
                return await _context.Orders.CountAsync(o => o.Status == status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders count by status: {Status}", status);
                throw;
            }
        }

        public async Task<int> GetTodayOrdersAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);
                
                return await _context.Orders
                    .CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting today's orders count");
                throw;
            }
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            try
            {
                return await _context.Orders
                    .Where(o => o.Status == OrderStatus.Delivered)
                    .SumAsync(o => o.Total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting total revenue");
                throw;
            }
        }

        public async Task<decimal> GetTotalRevenueByDateRangeAsync(DateTime fromDate, DateTime toDate)
        {
            try
            {
                var endOfDay = toDate.Date.AddDays(1).AddTicks(-1);
                
                return await _context.Orders
                    .Where(o => o.Status == OrderStatus.Delivered && 
                               o.DeliveredAt >= fromDate && 
                               o.DeliveredAt <= endOfDay)
                    .SumAsync(o => o.Total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue by date range");
                throw;
            }
        }

        public async Task<string> GenerateOrderNumberAsync()
        {
            try
            {
                var today = DateTime.UtcNow;
                var prefix = $"GW{today:yyyyMMdd}";
                
                var lastOrder = await _context.Orders
                    .Where(o => o.OrderNumber.StartsWith(prefix))
                    .OrderByDescending(o => o.OrderNumber)
                    .FirstOrDefaultAsync();

                if (lastOrder == null)
                {
                    return $"{prefix}001";
                }

                var lastNumberStr = lastOrder.OrderNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumberStr, out var lastNumber))
                {
                    return $"{prefix}{(lastNumber + 1):D3}";
                }

                return $"{prefix}001";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating order number");
                throw;
            }
        }
    }
}