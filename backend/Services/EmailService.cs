using backend.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly ISendGridClient _sendGridClient;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            
            var apiKey = _configuration["SendGrid:ApiKey"];
            _sendGridClient = new SendGridClient(apiKey);
        }

        public async Task<bool> SendEmailWithAttachmentAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlBody, 
            string attachmentPath, 
            string attachmentName)
        {
            try
            {
                var sendGridSettings = _configuration.GetSection("SendGrid");
                var fromEmail = sendGridSettings["FromEmail"] ?? "noreply@greenweave.com";
                var fromName = sendGridSettings["FromName"] ?? "GreenWeave Store";

                var from = new EmailAddress(fromEmail, fromName);
                var to = new EmailAddress(toEmail, toName);
                
                var msg = MailHelper.CreateSingleEmail(from, to, subject, null, htmlBody);

                // Add attachment if provided
                if (!string.IsNullOrEmpty(attachmentPath) && File.Exists(attachmentPath))
                {
                    var fileBytes = await File.ReadAllBytesAsync(attachmentPath);
                    var attachment = new Attachment
                    {
                        Content = Convert.ToBase64String(fileBytes),
                        Filename = attachmentName,
                        Type = "application/pdf",
                        Disposition = "attachment"
                    };
                    msg.AddAttachment(attachment);
                }

                var response = await _sendGridClient.SendEmailAsync(msg);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                    return true;
                }
                else
                {
                    var errorBody = await response.Body.ReadAsStringAsync();
                    _logger.LogError("Failed to send email to {Email}. Status: {Status}, Error: {Error}", 
                        toEmail, response.StatusCode, errorBody);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendOrderConfirmationEmailAsync(string toEmail, string customerName, string orderNumber, string invoiceAttachmentPath)
        {
            var subject = $"Xác nhận đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderConfirmationEmailTemplate(customerName, orderNumber);
            var attachmentName = $"invoice_{orderNumber}.pdf";

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, invoiceAttachmentPath, attachmentName);
        }

        public async Task<bool> SendOrderStatusUpdateEmailAsync(string toEmail, string customerName, string orderNumber, string newStatus)
        {
            var subject = $"Cập nhật đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderStatusUpdateEmailTemplate(customerName, orderNumber, newStatus);

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        private string GetOrderConfirmationEmailTemplate(string customerName, string orderNumber)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác nhận đơn hàng - GreenWeave</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }}
        .container {{
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 3px solid #22c55e;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 28px;
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
        }}
        .title {{
            font-size: 24px;
            color: #1f2937;
            margin: 20px 0;
        }}
        .order-info {{
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .order-number {{
            font-size: 20px;
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
        }}
        .message {{
            font-size: 16px;
            margin: 20px 0;
            line-height: 1.8;
        }}
        .highlight {{
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }}
        .contact-info {{
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>🌿 GreenWeave</div>
            <div class='title'>Xác nhận đơn hàng</div>
        </div>
        
        <div class='message'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            <p>Cảm ơn bạn đã tin tựng và mua sắm tại GreenWeave! Đơn hàng của bạn đã được xác nhận thành công.</p>
        </div>
        
        <div class='order-info'>
            <div class='order-number'>Mã đơn hàng: #{orderNumber}</div>
            <p>Đơn hàng của bạn đang được chuẩn bị và sẽ sớm được giao đến địa chỉ bạn đã cung cấp.</p>
        </div>
        
        <div class='highlight'>
            <strong>📎 Hóa đơn điện tử:</strong> Hóa đơn chi tiết của đơn hàng đã được đính kèm trong email này. 
            Bạn có thể tải xuống và lưu trữ để tra cứu khi cần thiết.
        </div>
        
        <div class='message'>
            <p><strong>Thông tin theo dõi đơn hàng:</strong></p>
            <ul>
                <li>Bạn sẽ nhận được email thông báo khi đơn hàng được giao cho đơn vị vận chuyển</li>
                <li>Mã theo dõi vận chuyển sẽ được gửi qua SMS và email</li>
                <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
            </ul>
        </div>
        
        <div class='contact-info'>
            <h3>Cần hỗ trợ?</h3>
            <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi:</p>
            <ul>
                <li>📧 Email: support@greenweave.com</li>
                <li>📞 Hotline: 1900-XXX-XXX</li>
                <li>💬 Chat trực tiếp trên website</li>
            </ul>
        </div>
        
        <div class='footer'>
            <p>Cảm ơn bạn đã chọn GreenWeave - Nơi thiên nhiên gặp gỡ thời trang!</p>
            <p>© 2024 GreenWeave. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GetOrderStatusUpdateEmailTemplate(string customerName, string orderNumber, string newStatus)
        {
            var statusMessage = newStatus switch
            {
                "Confirmed" => "đã được xác nhận",
                "Processing" => "đang được xử lý",
                "Shipping" => "đang được giao hàng",
                "Delivered" => "đã được giao thành công",
                "Cancelled" => "đã bị hủy",
                _ => "đã được cập nhật"
            };

            var statusColor = newStatus switch
            {
                "Confirmed" => "#22c55e",
                "Processing" => "#3b82f6",
                "Shipping" => "#f59e0b",
                "Delivered" => "#10b981",
                "Cancelled" => "#ef4444",
                _ => "#6b7280"
            };

            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Cập nhật đơn hàng - GreenWeave</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }}
        .container {{
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 3px solid #22c55e;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 28px;
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
        }}
        .title {{
            font-size: 24px;
            color: #1f2937;
            margin: 20px 0;
        }}
        .status-update {{
            background-color: #f0fdf4;
            border-left: 4px solid {statusColor};
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
        }}
        .order-number {{
            font-size: 20px;
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
        }}
        .status {{
            font-size: 18px;
            font-weight: bold;
            color: {statusColor};
            margin: 10px 0;
        }}
        .message {{
            font-size: 16px;
            margin: 20px 0;
            line-height: 1.8;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>🌿 GreenWeave</div>
            <div class='title'>Cập nhật đơn hàng</div>
        </div>
        
        <div class='message'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            <p>Chúng tôi có cập nhật mới về đơn hàng của bạn:</p>
        </div>
        
        <div class='status-update'>
            <div class='order-number'>Đơn hàng #{orderNumber}</div>
            <div class='status'>{statusMessage}</div>
            <p>Trạng thái hiện tại: <strong>{newStatus}</strong></p>
        </div>
        
        <div class='message'>
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại GreenWeave!</p>
            <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email support@greenweave.com hoặc hotline 1900-XXX-XXX.</p>
        </div>
        
        <div class='footer'>
            <p>Trân trọng,</p>
            <p><strong>GreenWeave Team</strong></p>
            <p>© 2024 GreenWeave. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}