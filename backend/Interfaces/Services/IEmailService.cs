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
        /// Gửi email thông báo xác nhận đơn hàng với ViettelPost link
        /// </summary>
        Task<bool> SendOrderConfirmationEmailWithLinkAsync(
            string customerEmail,
            string customerName,
            string orderNumber,
            string printLink,
            DateTimeOffset expiryTime
        );
        
        /// <summary>
        /// Gửi email thông báo xác nhận đơn hàng với cả PDF và ViettelPost link
        /// </summary>
        Task<bool> SendOrderConfirmationEmailWithBothAsync(
            string customerEmail,
            string customerName,
            string orderNumber,
            string invoicePath,
            string printLink,
            DateTimeOffset expiryTime
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
        
        /// <summary>
        /// Gửi email xác thực tài khoản
        /// </summary>
        Task<bool> SendEmailConfirmationAsync(
            string toEmail,
            string customerName,
            string confirmationLink
        );

        /// <summary>
        /// Gửi email đặt lại mật khẩu
        /// </summary>
        Task<bool> SendPasswordResetEmailAsync(
            string toEmail,
            string customerName,
            string resetLink
        );
    }
}