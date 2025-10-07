using backend.DTOs;
using backend.Interfaces.Services;
using backend.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IAuthService _authService;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(
            IOrderRepository orderRepository,
            IAuthService authService,
            ILogger<DashboardService> logger)
        {
            _orderRepository = orderRepository;
            _authService = authService;
            _logger = logger;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            try
            {
                var currentMonth = DateTime.UtcNow.Date.AddDays(1 - DateTime.UtcNow.Day);
                var lastMonth = currentMonth.AddMonths(-1);

                // Get current month data
                var orders = await _orderRepository.GetAllAsync();
                var currentMonthOrders = orders.Where(o => o.CreatedAt >= currentMonth).ToList();
                var lastMonthOrders = orders.Where(o => o.CreatedAt >= lastMonth && o.CreatedAt < currentMonth).ToList();

                // Get users data by role
                var customers = await _authService.GetUsersByRoleAsync("Customer");
                var adminUsers = await _authService.GetUsersByRoleAsync("Admin");
                var staffUsers = await _authService.GetUsersByRoleAsync("Staff");
                var allStaff = adminUsers.Concat(staffUsers).ToList();

                var currentMonthCustomers = customers.Where(c => c.CreatedAt >= currentMonth).Count();
                var lastMonthCustomers = customers.Where(c => c.CreatedAt >= lastMonth && c.CreatedAt < currentMonth).Count();

                // Calculate totals
                var totalRevenue = currentMonthOrders.Sum(o => o.Total);
                var lastMonthRevenue = lastMonthOrders.Sum(o => o.Total);

                // Calculate growth percentages
                var revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
                var ordersGrowth = lastMonthOrders.Count > 0 ? ((currentMonthOrders.Count - lastMonthOrders.Count) / (decimal)lastMonthOrders.Count) * 100 : 0;
                var customersGrowth = lastMonthCustomers > 0 ? ((currentMonthCustomers - lastMonthCustomers) / (decimal)lastMonthCustomers) * 100 : 0;

                return new DashboardStatsDto
                {
                    TotalRevenue = totalRevenue,
                    TotalOrders = currentMonthOrders.Count,
                    TotalCustomers = customers.Count(),
                    TotalStaff = allStaff.Count,
                    RevenueGrowth = revenueGrowth,
                    OrdersGrowth = ordersGrowth,
                    CustomersGrowth = customersGrowth,
                    StaffGrowth = 0 // Staff growth calculation can be implemented similarly
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                throw;
            }
        }

        public async Task<List<DashboardRevenueDto>> GetRevenueDataAsync(string period = "day")
        {
            try
            {
                var orders = await _orderRepository.GetAllAsync();
                var now = DateTime.UtcNow;
                var revenueData = new List<DashboardRevenueDto>();

                switch (period.ToLower())
                {
                    case "day":
                        // Last 24 hours, grouped by hour
                        for (int i = 23; i >= 0; i--)
                        {
                            var startHour = now.AddHours(-i).Date.AddHours(now.AddHours(-i).Hour);
                            var endHour = startHour.AddHours(1);
                            
                            var hourlyRevenue = orders
                                .Where(o => o.CreatedAt >= startHour && o.CreatedAt < endHour)
                                .Sum(o => o.Total);

                            revenueData.Add(new DashboardRevenueDto
                            {
                                Date = startHour.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                                Revenue = hourlyRevenue
                            });
                        }
                        break;

                    case "week":
                        // Last 7 days
                        for (int i = 6; i >= 0; i--)
                        {
                            var date = now.Date.AddDays(-i);
                            var nextDate = date.AddDays(1);
                            
                            var dailyRevenue = orders
                                .Where(o => o.CreatedAt >= date && o.CreatedAt < nextDate)
                                .Sum(o => o.Total);

                            revenueData.Add(new DashboardRevenueDto
                            {
                                Date = date.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                                Revenue = dailyRevenue
                            });
                        }
                        break;

                    case "month":
                        // Last 30 days
                        for (int i = 29; i >= 0; i--)
                        {
                            var date = now.Date.AddDays(-i);
                            var nextDate = date.AddDays(1);
                            
                            var dailyRevenue = orders
                                .Where(o => o.CreatedAt >= date && o.CreatedAt < nextDate)
                                .Sum(o => o.Total);

                            revenueData.Add(new DashboardRevenueDto
                            {
                                Date = date.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                                Revenue = dailyRevenue
                            });
                        }
                        break;

                    default:
                        // Default to day
                        return await GetRevenueDataAsync("day");
                }

                return revenueData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue data for period: {Period}", period);
                throw;
            }
        }

        public async Task<List<DashboardActivityDto>> GetRecentActivitiesAsync()
        {
            try
            {
                var activities = new List<DashboardActivityDto>();

                // Get recent orders
                var recentOrders = await _orderRepository.GetAllAsync();
                var ordersActivities = recentOrders
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(10)
                    .Select(o => new DashboardActivityDto
                    {
                        Id = o.Id.ToString(),
                        Type = "order",
                        Title = "Đơn hàng mới",
                        Description = $"Đơn hàng #{o.OrderNumber} đã được tạo",
                        Timestamp = o.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        User = o.Customer?.FullName ?? "Khách hàng",
                        Value = $"{o.Total:N0}đ"
                    });

                activities.AddRange(ordersActivities);

                // Get recent customers
                var recentCustomers = await _authService.GetUsersByRoleAsync("Customer");
                var customerActivities = recentCustomers
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(5)
                    .Select(u => new DashboardActivityDto
                    {
                        Id = u.Id,
                        Type = "customer",
                        Title = "Khách hàng mới",
                        Description = "Khách hàng mới đã đăng ký",
                        Timestamp = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        User = u.FullName ?? u.Email,
                        Value = null
                    });

                activities.AddRange(customerActivities);

                // Sort by timestamp and return top 15
                return activities
                    .OrderByDescending(a => DateTime.Parse(a.Timestamp))
                    .Take(15)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent activities");
                throw;
            }
        }
    }
}