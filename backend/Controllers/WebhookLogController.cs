using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for webhook log operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class WebhookLogController : ControllerBase
    {
        private readonly IWebhookLogService _webhookLogService;
        private readonly ILogger<WebhookLogController> _logger;

        public WebhookLogController(
            IWebhookLogService webhookLogService,
            ILogger<WebhookLogController> logger)
        {
            _webhookLogService = webhookLogService;
            _logger = logger;
        }

        /// <summary>
        /// Get all webhook logs with pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 50)</param>
        /// <returns>List of webhook logs</returns>
        [HttpGet]
        [ProducesResponseType(typeof(WebhookLogListResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetWebhookLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 50;

                var result = await _webhookLogService.GetAllAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs");
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy danh sách webhook logs" });
            }
        }

        /// <summary>
        /// Get webhook logs by order number
        /// </summary>
        /// <param name="orderNumber">Order number</param>
        /// <returns>List of webhook logs for the order</returns>
        [HttpGet("order/{orderNumber}")]
        [ProducesResponseType(typeof(List<WebhookLogDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetWebhookLogsByOrderNumber(string orderNumber)
        {
            try
            {
                if (string.IsNullOrEmpty(orderNumber))
                {
                    return BadRequest(new { success = false, message = "Order number is required" });
                }

                var webhookLogs = await _webhookLogService.GetByOrderNumberAsync(orderNumber);
                return Ok(new { success = true, data = webhookLogs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs by order number: {OrderNumber}", orderNumber);
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy webhook logs theo order number" });
            }
        }

        /// <summary>
        /// Get webhook logs by order ID
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>List of webhook logs for the order</returns>
        [HttpGet("order-id/{orderId}")]
        [ProducesResponseType(typeof(List<WebhookLogDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetWebhookLogsByOrderId(int orderId)
        {
            try
            {
                if (orderId <= 0)
                {
                    return BadRequest(new { success = false, message = "Order ID must be greater than 0" });
                }

                var webhookLogs = await _webhookLogService.GetByOrderIdAsync(orderId);
                return Ok(new { success = true, data = webhookLogs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs by order ID: {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy webhook logs theo order ID" });
            }
        }

        /// <summary>
        /// Get webhook log by ID
        /// </summary>
        /// <param name="id">Webhook log ID</param>
        /// <returns>Webhook log details</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(WebhookLogDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetWebhookLog(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "ID must be greater than 0" });
                }

                var webhookLog = await _webhookLogService.GetByIdAsync(id);
                if (webhookLog == null)
                {
                    return NotFound(new { success = false, message = "Webhook log not found" });
                }

                return Ok(new { success = true, data = webhookLog });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook log by ID: {Id}", id);
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy webhook log" });
            }
        }

        /// <summary>
        /// Get webhook statistics
        /// </summary>
        /// <returns>Webhook statistics</returns>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(WebhookStatsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetWebhookStats()
        {
            try
            {
                var stats = await _webhookLogService.GetStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook stats");
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy thống kê webhook" });
            }
        }

        /// <summary>
        /// Get recent webhook logs
        /// </summary>
        /// <param name="count">Number of recent logs to get (default: 10)</param>
        /// <returns>List of recent webhook logs</returns>
        [HttpGet("recent")]
        [ProducesResponseType(typeof(List<WebhookLogDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetRecentWebhookLogs([FromQuery] int count = 10)
        {
            try
            {
                if (count < 1 || count > 100) count = 10;

                var webhookLogs = await _webhookLogService.GetRecentAsync(count);
                return Ok(new { success = true, data = webhookLogs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent webhook logs");
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy webhook logs gần đây" });
            }
        }
    }
}
