using backend.Models;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Interface for email notification service
    /// </summary>
    public interface IEmailNotificationService
    {
        /// <summary>
        /// Send order confirmed email with tracking information
        /// </summary>
        Task SendOrderConfirmedEmailAsync(string toEmail, string customerName, string orderNumber, decimal total, string? trackingCode = null);

        /// <summary>
        /// Send order shipping status update email
        /// </summary>
        Task SendOrderShippingEmailAsync(string toEmail, string customerName, string orderNumber, string trackingCode, string? carrierName = "Viettel Post");

        /// <summary>
        /// Send order delivered confirmation email
        /// </summary>
        Task SendOrderDeliveredEmailAsync(string toEmail, string customerName, string orderNumber, decimal total);
    }
}
