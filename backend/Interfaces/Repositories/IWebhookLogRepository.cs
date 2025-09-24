using backend.Models;

namespace backend.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for WebhookLog operations
    /// </summary>
    public interface IWebhookLogRepository
    {
        /// <summary>
        /// Get all webhook logs with pagination
        /// </summary>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>List of webhook logs</returns>
        Task<IEnumerable<WebhookLog>> GetAllAsync(int page = 1, int pageSize = 50);

        /// <summary>
        /// Get webhook logs by order number
        /// </summary>
        /// <param name="orderNumber">Order number</param>
        /// <returns>List of webhook logs</returns>
        Task<IEnumerable<WebhookLog>> GetByOrderNumberAsync(string orderNumber);

        /// <summary>
        /// Get webhook logs by order ID
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>List of webhook logs</returns>
        Task<IEnumerable<WebhookLog>> GetByOrderIdAsync(int orderId);

        /// <summary>
        /// Get webhook log by ID
        /// </summary>
        /// <param name="id">Webhook log ID</param>
        /// <returns>Webhook log or null</returns>
        Task<WebhookLog?> GetByIdAsync(int id);

        /// <summary>
        /// Add new webhook log
        /// </summary>
        /// <param name="webhookLog">Webhook log to add</param>
        /// <returns>Added webhook log</returns>
        Task<WebhookLog> AddAsync(WebhookLog webhookLog);

        /// <summary>
        /// Update webhook log
        /// </summary>
        /// <param name="webhookLog">Webhook log to update</param>
        /// <returns>Updated webhook log</returns>
        Task<WebhookLog> UpdateAsync(WebhookLog webhookLog);

        /// <summary>
        /// Get webhook statistics
        /// </summary>
        /// <returns>Webhook statistics</returns>
        Task<WebhookStats> GetStatsAsync();

        /// <summary>
        /// Get recent webhook logs
        /// </summary>
        /// <param name="count">Number of recent logs to get</param>
        /// <returns>List of recent webhook logs</returns>
        Task<IEnumerable<WebhookLog>> GetRecentAsync(int count = 10);
    }

    /// <summary>
    /// Webhook statistics
    /// </summary>
    public class WebhookStats
    {
        public int TotalWebhooks { get; set; }
        public int SuccessfulWebhooks { get; set; }
        public int FailedWebhooks { get; set; }
        public DateTime? LastWebhookTime { get; set; }
        public List<string> RecentOrderNumbers { get; set; } = new();
    }
}
