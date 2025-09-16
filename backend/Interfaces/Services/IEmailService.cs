namespace backend.Interfaces.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Gửi email với attachment
        /// </summary>
        Task<bool> SendEmailWithAttachmentAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlBody, 
            string attachmentPath, 
            string attachmentName
        );
        
        /// <summary>
        /// Gửi email thông báo xác nhận đơn hàng
        /// </summary>
        Task<bool> SendOrderConfirmationEmailAsync(
            string customerEmail,
            string customerName,
            string orderNumber,
            string invoicePath
        );
        
        /// <summary>
        /// Gửi email thông báo cập nhật trạng thái đơn hàng
        /// </summary>
        Task<bool> SendOrderStatusUpdateEmailAsync(
            string customerEmail,
            string customerName,
            string orderNumber,
            string newStatus
        );
    }
}