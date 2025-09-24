using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Service interface for WebhookLog operations
    /// </summary>
    public interface IWebhookLogService
    {
        /// <summary>
        /// Get all webhook logs with pagination
        /// </summary>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>List of webhook log DTOs</returns>
        Task<WebhookLogListResult> GetAllAsync(int page = 1, int pageSize = 50);

        /// <summary>
        /// Get webhook logs by order number
        /// </summary>
        /// <param name="orderNumber">Order number</param>
        /// <returns>List of webhook log DTOs</returns>
        Task<List<WebhookLogDto>> GetByOrderNumberAsync(string orderNumber);

        /// <summary>
        /// Get webhook logs by order ID
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>List of webhook log DTOs</returns>
        Task<List<WebhookLogDto>> GetByOrderIdAsync(int orderId);

        /// <summary>
        /// Get webhook log by ID
        /// </summary>
        /// <param name="id">Webhook log ID</param>
        /// <returns>Webhook log DTO or null</returns>
        Task<WebhookLogDto?> GetByIdAsync(int id);

        /// <summary>
        /// Get webhook statistics
        /// </summary>
        /// <returns>Webhook statistics</returns>
        Task<WebhookStatsDto> GetStatsAsync();

        /// <summary>
        /// Get recent webhook logs
        /// </summary>
        /// <param name="count">Number of recent logs to get</param>
        /// <returns>List of recent webhook log DTOs</returns>
        Task<List<WebhookLogDto>> GetRecentAsync(int count = 10);

        /// <summary>
        /// Log webhook event
        /// </summary>
        /// <param name="webhookData">Webhook data</param>
        /// <param name="isSuccess">Whether processing was successful</param>
        /// <param name="errorMessage">Error message if failed</param>
        /// <param name="orderId">Related order ID</param>
        /// <param name="shippingRequestId">Related shipping request ID</param>
        /// <returns>Created webhook log DTO</returns>
        Task<WebhookLogDto> LogWebhookAsync(
            ViettelPostWebhookData webhookData, 
            bool isSuccess, 
            string? errorMessage = null,
            int? orderId = null,
            int? shippingRequestId = null);
    }
}
