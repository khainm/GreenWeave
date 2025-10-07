using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<List<DashboardRevenueDto>> GetRevenueDataAsync(string period = "day");
        Task<List<DashboardActivityDto>> GetRecentActivitiesAsync();
    }
}