using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.DTOs;
using backend.Interfaces.Services;

namespace backend.Controllers
{
    /// <summary>
    /// Dashboard controller để cung cấp dữ liệu cho dashboard admin
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin,Staff")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            IDashboardService dashboardService,
            ILogger<DashboardController> logger)
        {
            _dashboardService = dashboardService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy thống kê tổng quan dashboard
        /// </summary>
        /// <returns>Thống kê dashboard</returns>
        /// <response code="200">Trả về thống kê thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("stats")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            try
            {
                var stats = await _dashboardService.GetDashboardStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thống kê dashboard" });
            }
        }

        /// <summary>
        /// Lấy dữ liệu doanh thu theo thời gian
        /// </summary>
        /// <param name="period">Khoảng thời gian (day, week, month)</param>
        /// <returns>Dữ liệu doanh thu</returns>
        /// <response code="200">Trả về dữ liệu doanh thu thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("revenue")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<DashboardRevenueDto>>> GetRevenueData([FromQuery] string period = "day")
        {
            try
            {
                var revenueData = await _dashboardService.GetRevenueDataAsync(period);
                return Ok(revenueData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue data for period: {Period}", period);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy dữ liệu doanh thu" });
            }
        }

        /// <summary>
        /// Lấy hoạt động gần đây
        /// </summary>
        /// <returns>Danh sách hoạt động gần đây</returns>
        /// <response code="200">Trả về hoạt động gần đây thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("activities")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<DashboardActivityDto>>> GetRecentActivities()
        {
            try
            {
                var activities = await _dashboardService.GetRecentActivitiesAsync();
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent activities");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy hoạt động gần đây" });
            }
        }
    }
}