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

        /// <summary>
        /// 🚀 Gửi email với PDF attachment từ memory (không lưu file trên server)
        /// </summary>
        public async Task<bool> SendEmailWithMemoryAttachmentAsync(
            string toEmail, 
            string toName, 
            string subject, 
            string htmlBody, 
            byte[] attachmentBytes, 
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

                // Add PDF attachment from memory
                if (attachmentBytes != null && attachmentBytes.Length > 0)
                {
                    var attachment = new Attachment
                    {
                        Content = Convert.ToBase64String(attachmentBytes),
                        Filename = attachmentName,
                        Type = "application/pdf",
                        Disposition = "attachment"
                    };
                    msg.AddAttachment(attachment);
                    _logger.LogInformation("PDF attachment added: {FileName}, Size: {Size} bytes", attachmentName, attachmentBytes.Length);
                }

                var response = await _sendGridClient.SendEmailAsync(msg);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email with memory PDF sent successfully to {Email}", toEmail);
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
                _logger.LogError(ex, "Error sending email with memory attachment to {Email}", toEmail);
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

        /// <summary>
        /// 🚀 Gửi email xác nhận đơn hàng với PDF từ memory (không lưu file)
        /// </summary>
        public async Task<bool> SendOrderConfirmationEmailWithMemoryPdfAsync(
            string customerEmail,
            string customerName,
            string orderNumber,
            byte[] pdfBytes)
        {
            var subject = $"Xác nhận đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderConfirmationEmailTemplate(customerName, orderNumber);
            var attachmentName = $"HoaDon_{orderNumber}.pdf";

            return await SendEmailWithMemoryAttachmentAsync(customerEmail, customerName, subject, htmlBody, pdfBytes, attachmentName);
        }

        public async Task<bool> SendOrderConfirmationEmailWithLinkAsync(string toEmail, string customerName, string orderNumber, string printLink, DateTimeOffset expiryTime)
        {
            var subject = $"Xác nhận đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderConfirmationEmailWithLinkTemplate(customerName, orderNumber, printLink, expiryTime);

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        public async Task<bool> SendOrderConfirmationEmailWithBothAsync(string toEmail, string customerName, string orderNumber, string invoicePath, string printLink, DateTimeOffset expiryTime)
        {
            var subject = $"Xác nhận đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderConfirmationEmailWithBothTemplate(customerName, orderNumber, printLink, expiryTime);
            var attachmentName = $"invoice_{orderNumber}.pdf";

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, invoicePath, attachmentName);
        }

        public async Task<bool> SendOrderStatusUpdateEmailAsync(string toEmail, string customerName, string orderNumber, string newStatus)
        {
            var subject = $"Cập nhật đơn hàng #{orderNumber} - GreenWeave";
            var htmlBody = GetOrderStatusUpdateEmailTemplate(customerName, orderNumber, newStatus);

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        /// <summary>
        /// 🔥 Gửi email xác nhận đơn hàng ngay khi tạo (immediate confirmation)
        /// </summary>
        public async Task<bool> SendOrderCreatedEmailAsync(
            string customerEmail, 
            string customerName, 
            string orderNumber, 
            decimal totalAmount, 
            string paymentMethod)
        {
            var subject = $"Đơn hàng #{orderNumber} đã được tạo thành công - GreenWeave";
            var htmlBody = GetOrderCreatedEmailTemplate(customerName, orderNumber, totalAmount, paymentMethod);

            return await SendEmailWithAttachmentAsync(customerEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        public async Task<bool> SendEmailConfirmationAsync(string toEmail, string customerName, string confirmationLink)
        {
            var subject = "Xác thực tài khoản - GreenWeave";
            var htmlBody = GetEmailConfirmationTemplate(customerName, confirmationLink);

            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string customerName, string resetLink)
        {
            var subject = "Đặt lại mật khẩu - GreenWeave";
            var htmlBody = GetPasswordResetTemplate(customerName, resetLink);
            return await SendEmailWithAttachmentAsync(toEmail, customerName, subject, htmlBody, string.Empty, string.Empty);
        }

        private string GetOrderConfirmationEmailWithLinkTemplate(string customerName, string orderNumber, string printLink, DateTimeOffset expiryTime)
        {
            var expiryDate = expiryTime.ToString("dd/MM/yyyy HH:mm");
            
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
        .print-link {{
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
            text-align: center;
        }}
        .print-button {{
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            transition: background-color 0.3s;
        }}
        .print-button:hover {{
            background-color: #2563eb;
        }}
        .expiry-info {{
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
            color: #6b7280;
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
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' style='height: 40px; width: auto;' />
            </div>
            <div class='title'>Xác nhận đơn hàng</div>
        </div>
        
        <div class='message'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại GreenWeave! Đơn hàng của bạn đã được xác nhận thành công.</p>
        </div>
        
        <div class='order-info'>
            <div class='order-number'>Mã đơn hàng: #{orderNumber}</div>
            <p>Đơn hàng của bạn đang được chuẩn bị và sẽ sớm được giao đến địa chỉ bạn đã cung cấp.</p>
        </div>
        
        <div class='print-link'>
            <h3>📄 Hóa đơn điện tử</h3>
            <p>Bạn có thể xem và in hóa đơn bằng cách click vào nút bên dưới:</p>
            <a href='{printLink}' class='print-button'>Xem và In Hóa đơn</a>
            <div class='expiry-info'>
                <strong>⏰ Link có hiệu lực đến:</strong> {expiryDate}
            </div>
        </div>
        
        <div class='message'>
            <p><strong>Thông tin theo dõi đơn hàng:</strong></p>
            <ul>
                <li>Bạn sẽ nhận được email thông báo khi đơn hàng được giao cho đơn vị vận chuyển</li>
                <li>Mã theo dõi vận chuyển sẽ được gửi qua SMS và email</li>
                <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
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

        private string GetOrderConfirmationEmailWithBothTemplate(string customerName, string orderNumber, string printLink, DateTimeOffset expiryTime)
        {
            var expiryDate = expiryTime.ToString("dd/MM/yyyy HH:mm");
            
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
        .invoice-section {{
            background-color: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }}
        .print-link {{
            background-color: #dbeafe;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            text-align: center;
        }}
        .print-button {{
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            transition: background-color 0.3s;
        }}
        .print-button:hover {{
            background-color: #2563eb;
        }}
        .expiry-info {{
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
            color: #6b7280;
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
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' style='height: 40px; width: auto;' />
            </div>
            <div class='title'>Xác nhận đơn hàng</div>
        </div>
        
        <div class='message'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại GreenWeave! Đơn hàng của bạn đã được xác nhận thành công.</p>
        </div>
        
        <div class='order-info'>
            <div class='order-number'>Mã đơn hàng: #{orderNumber}</div>
            <p>Đơn hàng của bạn đang được chuẩn bị và sẽ sớm được giao đến địa chỉ bạn đã cung cấp.</p>
        </div>
        
        <div class='invoice-section'>
            <h3>📄 Hóa đơn điện tử</h3>
            <p><strong>Hóa đơn chi tiết</strong> đã được đính kèm trong email này. Bạn có thể tải xuống và lưu trữ để tra cứu khi cần thiết.</p>
        </div>
        
        <div class='print-link'>
            <h3>🚚 Link in phiếu gửi hàng</h3>
            <p>Bạn cũng có thể sử dụng link bên dưới để in phiếu gửi hàng từ ViettelPost:</p>
            <a href='{printLink}' class='print-button'>In Phiếu Gửi Hàng</a>
            <div class='expiry-info'>
                <strong>⏰ Link có hiệu lực đến:</strong> {expiryDate}
            </div>
        </div>
        
        <div class='message'>
            <p><strong>Thông tin theo dõi đơn hàng:</strong></p>
            <ul>
                <li>Bạn sẽ nhận được email thông báo khi đơn hàng được giao cho đơn vị vận chuyển</li>
                <li>Mã theo dõi vận chuyển sẽ được gửi qua SMS và email</li>
                <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
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
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }}
        
        .header {{
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 100 100""><defs><pattern id=""grain"" width=""100"" height=""100"" patternUnits=""userSpaceOnUse""><circle cx=""50"" cy=""50"" r=""1"" fill=""white"" opacity=""0.1""/></pattern></defs><rect width=""100"" height=""100"" fill=""url(%23grain)""/></svg>');
            opacity: 0.1;
        }}
        
        .logo {{
            position: relative;
            z-index: 1;
        }}
        
        .logo img {{
            height: 50px;
            width: auto;
            filter: brightness(0) invert(1);
        }}
        
        .header-title {{
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-top: 15px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        
        .header-subtitle {{
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-top: 8px;
        }}
        
        .content {{
            padding: 40px 30px;
        }}
        
        .greeting {{
            font-size: 18px;
            margin-bottom: 24px;
            color: #374151;
        }}
        
        .order-card {{
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            position: relative;
            overflow: hidden;
        }}
        
        .order-card::before {{
            content: '📦';
            position: absolute;
            top: -10px;
            right: -10px;
            font-size: 60px;
            opacity: 0.1;
            transform: rotate(15deg);
        }}
        
        .order-number {{
            font-size: 24px;
            font-weight: 700;
            color: #16a34a;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .order-number::before {{
            content: '✅';
            font-size: 20px;
        }}
        
        .order-description {{
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
        }}
        
        .info-card {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #fbbf24;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            position: relative;
        }}
        
        .info-card::before {{
            content: '📄';
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 24px;
        }}
        
        .info-title {{
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 16px;
        }}
        
        .info-text {{
            color: #a16207;
            line-height: 1.6;
        }}
        
        .timeline {{
            margin: 32px 0;
        }}
        
        .timeline-title {{
            font-size: 18px;
            font-weight: 700;
            color: #374151;
            margin-bottom: 20px;
        }}
        
        .timeline-item {{
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 12px 0;
        }}
        
        .timeline-icon {{
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            margin-right: 16px;
            flex-shrink: 0;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }}
        
        .timeline-content {{
            color: #4b5563;
            line-height: 1.5;
        }}
        
        .contact-section {{
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            border: 1px solid #cbd5e1;
        }}
        
        .contact-title {{
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .contact-title::before {{
            content: '🤝';
            font-size: 20px;
        }}
        
        .contact-grid {{
            display: grid;
            gap: 12px;
        }}
        
        .contact-item {{
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            color: #475569;
        }}
        
        .contact-icon {{
            width: 20px;
            text-align: center;
        }}
        
        .footer {{
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            padding: 32px 30px;
            text-align: center;
            color: white;
        }}
        
        .footer-brand {{
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .footer-tagline {{
            color: #9ca3af;
            margin-bottom: 16px;
            font-style: italic;
        }}
        
        .footer-copyright {{
            color: #6b7280;
            font-size: 14px;
        }}
        
        @media (max-width: 600px) {{
            body {{
                padding: 10px;
            }}
            
            .content {{
                padding: 24px 20px;
            }}
            
            .header {{
                padding: 24px 20px;
            }}
            
            .header-title {{
                font-size: 24px;
            }}
            
            .order-number {{
                font-size: 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' />
            </div>
            <h1 class='header-title'>Xác nhận đơn hàng</h1>
            <p class='header-subtitle'>Cảm ơn bạn đã tin tưởng GreenWeave</p>
        </div>
        
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{customerName}</strong>,</p>
                <p>Đơn hàng của bạn đã được xác nhận thành công và đang được chuẩn bị! 🎉</p>
            </div>
            
            <div class='order-card'>
                <div class='order-number'>Đơn hàng #{orderNumber}</div>
                <div class='order-description'>
                    Đơn hàng của bạn đang được chuẩn bị cẩn thận và sẽ sớm được giao đến địa chỉ bạn đã cung cấp.
                </div>
            </div>
            
            <div class='info-card'>
                <div class='info-title'>Hóa đơn điện tử đính kèm</div>
                <div class='info-text'>
                    Hóa đơn chi tiết của đơn hàng đã được đính kèm trong email này. 
                    Bạn có thể tải xuống và lưu trữ để tra cứu khi cần thiết.
                </div>
            </div>
            
            <div class='timeline'>
                <div class='timeline-title'>🚚 Tiến trình đơn hàng</div>
                
                <div class='timeline-item'>
                    <div class='timeline-icon'>📧</div>
                    <div class='timeline-content'>
                        <strong>Email thông báo</strong> khi đơn hàng được giao cho đơn vị vận chuyển
                    </div>
                </div>
                
                <div class='timeline-item'>
                    <div class='timeline-icon'>📱</div>
                    <div class='timeline-content'>
                        <strong>Mã tracking</strong> sẽ được gửi qua SMS và email để theo dõi
                    </div>
                </div>
                
                <div class='timeline-item'>
                    <div class='timeline-icon'>⏰</div>
                    <div class='timeline-content'>
                        <strong>Thời gian giao hàng:</strong> 2-5 ngày làm việc
                    </div>
                </div>
            </div>
            
            <div class='contact-section'>
                <div class='contact-title'>Cần hỗ trợ?</div>
                <div class='contact-grid'>
                    <div class='contact-item'>
                        <span class='contact-icon'>📧</span>
                        <span>info.greenweave@gmail.com</span>
                    </div>
                    <div class='contact-item'>
                        <span class='contact-icon'>📞</span>
                        <span>0359994361</span>
                    </div>
                    <div class='contact-item'>
                        <span class='contact-icon'>💬</span>
                        <span>Chat trực tiếp trên website</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class='footer'>
            <div class='footer-brand'>🌱 GreenWeave</div>
            <div class='footer-tagline'>Nơi thiên nhiên gặp gỡ thời trang</div>
            <div class='footer-copyright'>© 2024 GreenWeave. All rights reserved.</div>
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
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' style='height: 40px; width: auto;' />
            </div>
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

        private string GetEmailConfirmationTemplate(string customerName, string confirmationLink)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác thực tài khoản - GreenWeave</title>
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
        .content {{
            margin: 20px 0;
        }}
        .button {{
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }}
        .button:hover {{
            background-color: #16a34a;
        }}
        .backup-link {{
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            word-break: break-all;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' style='height: 40px; width: auto;' />
            </div>
            <h1 class='title'>Xác thực tài khoản</h1>
        </div>
        
        <div class='content'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            
            <p>🌟 Chào mừng bạn đến với gia đình GreenWeave! Để hoàn tất quá trình đăng ký và bắt đầu hành trình thời trang bền vững, vui lòng xác thực email của bạn bằng cách nhấp vào nút bên dưới:</p>
            
            <div style='text-align: center;'>
                <a href='{confirmationLink}' class='button'>✅ Xác thực tài khoản</a>
            </div>
            
            <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 24 giờ.</p>
            
            <div class='backup-link'>
                <p><strong>Nếu nút không hoạt động, hãy copy link này vào trình duyệt:</strong></p>
                <p>{confirmationLink}</p>
            </div>
            
            <p>Sau khi xác thực, bạn sẽ có thể:</p>
            <ul>
                <li>Đăng nhập vào tài khoản</li>
                <li>Mua sắm các sản phẩm thân thiện với môi trường</li>
                <li>Theo dõi đơn hàng</li>
                <li>Quản lý thông tin cá nhân</li>
            </ul>
        </div>
        
        <div class='footer'>
            <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            <p>© 2024 GreenWeave. Tất cả quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GetPasswordResetTemplate(string customerName, string resetLink)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Đặt lại mật khẩu - GreenWeave</title>
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
        .content {{
            margin: 20px 0;
        }}
        .button {{
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }}
        .button:hover {{
            background-color: #16a34a;
        }}
        .backup-link {{
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            word-break: break-all;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'>
                <img src='https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png' alt='GreenWeave' style='height: 40px; width: auto;' />
            </div>
            <h1 class='title'>Đặt lại mật khẩu</h1>
        </div>
        
        <div class='content'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản GreenWeave của bạn. Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
            
            <div style='text-align: center;'>
                <a href='{resetLink}' class='button'>🔒 Đặt lại mật khẩu</a>
            </div>
            
            <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 1 giờ.</p>
            
            <div class='backup-link'>
                <p><strong>Nếu nút không hoạt động, hãy copy link này vào trình duyệt:</strong></p>
                <p>{resetLink}</p>
            </div>
            
            <p><strong>Bảo mật:</strong></p>
            <ul>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn tạo mật khẩu mới</li>
                <li>Liên kết này chỉ có thể sử dụng một lần</li>
            </ul>
        </div>
        
        <div class='footer'>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <p>© 2024 GreenWeave. Tất cả quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>";
        }

        /// <summary>
        /// 🔥 Template cho email xác nhận đơn hàng ngay khi tạo
        /// </summary>
        private string GetOrderCreatedEmailTemplate(string customerName, string orderNumber, decimal totalAmount, string paymentMethod)
        {
            var paymentMethodText = paymentMethod switch
            {
                "BankTransfer" => "Chuyển khoản ngân hàng",
                "CashOnDelivery" => "Thanh toán khi nhận hàng (COD)",
                _ => "Khác"
            };

            var paymentIcon = paymentMethod switch
            {
                "BankTransfer" => "🏦",
                "CashOnDelivery" => "💵",
                _ => "💳"
            };

            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Đơn hàng đã được tạo - GreenWeave</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }}
        
        .header {{
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
        }}
        
        .success-icon {{
            font-size: 48px;
            margin-bottom: 16px;
            animation: bounce 2s infinite;
        }}
        
        @keyframes bounce {{
            0%, 20%, 50%, 80%, 100% {{ transform: translateY(0); }}
            40% {{ transform: translateY(-10px); }}
            60% {{ transform: translateY(-5px); }}
        }}
        
        .header-title {{
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
        }}
        
        .header-subtitle {{
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            position: relative;
            z-index: 1;
        }}
        
        .content {{
            padding: 40px 30px;
        }}
        
        .greeting {{
            font-size: 18px;
            margin-bottom: 24px;
            color: #374151;
        }}
        
        .order-summary {{
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #0ea5e9;
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            position: relative;
            overflow: hidden;
        }}
        
        .order-summary::before {{
            content: '🎯';
            position: absolute;
            top: -10px;
            right: -10px;
            font-size: 60px;
            opacity: 0.1;
            transform: rotate(-15deg);
        }}
        
        .order-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
        }}
        
        .order-number {{
            font-size: 20px;
            font-weight: 700;
            color: #0284c7;
        }}
        
        .status-badge {{
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #92400e;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
        }}
        
        .order-details {{
            display: grid;
            gap: 16px;
        }}
        
        .detail-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(14, 165, 233, 0.1);
        }}
        
        .detail-row:last-child {{
            border-bottom: none;
            padding-top: 16px;
            margin-top: 8px;
            border-top: 2px solid rgba(14, 165, 233, 0.2);
        }}
        
        .detail-label {{
            font-weight: 600;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .detail-value {{
            font-weight: 700;
            color: #0f172a;
        }}
        
        .amount {{
            font-size: 24px;
            color: #059669;
            text-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);
        }}
        
        .steps-container {{
            margin: 32px 0;
        }}
        
        .steps-title {{
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .step {{
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            padding: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            transition: all 0.3s ease;
        }}
        
        .step:hover {{
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }}
        
        .step-number {{
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-right: 16px;
            flex-shrink: 0;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }}
        
        .step-content {{
            flex: 1;
        }}
        
        .step-title {{
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }}
        
        .step-description {{
            color: #6b7280;
            line-height: 1.5;
        }}
        
        .payment-info {{
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }}
        
        .payment-title {{
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 16px;
        }}
        
        .payment-method {{
            font-size: 18px;
            font-weight: 600;
            color: #a16207;
        }}
        
        .cta-section {{
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
            border: 1px solid #bbf7d0;
        }}
        
        .cta-text {{
            color: #166534;
            font-style: italic;
            font-size: 18px;
            margin-bottom: 16px;
        }}
        
        .eco-badge {{
            display: inline-block;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
        }}
        
        .footer {{
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            padding: 32px 30px;
            text-align: center;
            color: white;
        }}
        
        .footer-content {{
            max-width: 400px;
            margin: 0 auto;
        }}
        
        .footer-brand {{
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .footer-tagline {{
            color: #9ca3af;
            margin-bottom: 16px;
            font-style: italic;
        }}
        
        .footer-copyright {{
            color: #6b7280;
            font-size: 14px;
        }}
        
        @media (max-width: 600px) {{
            body {{
                padding: 10px;
            }}
            
            .content {{
                padding: 24px 20px;
            }}
            
            .header {{
                padding: 24px 20px;
            }}
            
            .order-header {{
                flex-direction: column;
                align-items: flex-start;
            }}
            
            .detail-row {{
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }}
            
            .step {{
                padding: 12px;
            }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='success-icon'>�</div>
            <h1 class='header-title'>Đơn hàng đã được tạo!</h1>
            <p class='header-subtitle'>Cảm ơn bạn đã tin tưởng GreenWeave</p>
        </div>
        
        <div class='content'>
            <div class='greeting'>
                <p>Xin chào <strong>{customerName}</strong>,</p>
                <p>Đơn hàng của bạn đã được tiếp nhận thành công! Chúng tôi đang xử lý đơn hàng với sự cẩn trọng tối đa.</p>
            </div>
            
            <div class='order-summary'>
                <div class='order-header'>
                    <div class='order-number'>#{orderNumber}</div>
                    <div class='status-badge'>🔄 Đang xử lý</div>
                </div>
                
                <div class='order-details'>
                    <div class='detail-row'>
                        <span class='detail-label'>💰 Tổng tiền:</span>
                        <span class='detail-value amount'>{totalAmount:N0} ₫</span>
                    </div>
                    <div class='detail-row'>
                        <span class='detail-label'>{paymentIcon} Thanh toán:</span>
                        <span class='detail-value'>{paymentMethodText}</span>
                    </div>
                </div>
            </div>
            
            <div class='steps-container'>
                <div class='steps-title'>🚀 Các bước tiếp theo</div>
                
                <div class='step'>
                    <div class='step-number'>1</div>
                    <div class='step-content'>
                        <div class='step-title'>Xem xét đơn hàng</div>
                        <div class='step-description'>Chúng tôi sẽ kiểm tra và xác nhận đơn hàng trong vòng 24 giờ</div>
                    </div>
                </div>
                
                <div class='step'>
                    <div class='step-number'>2</div>
                    <div class='step-content'>
                        <div class='step-title'>Gửi hóa đơn</div>
                        <div class='step-description'>Bạn sẽ nhận được email xác nhận với hóa đơn chi tiết</div>
                    </div>
                </div>
                
                <div class='step'>
                    <div class='step-number'>3</div>
                    <div class='step-content'>
                        <div class='step-title'>Chuẩn bị giao hàng</div>
                        <div class='step-description'>Đơn hàng sẽ được đóng gói và giao cho đơn vị vận chuyển</div>
                    </div>
                </div>
            </div>
            
            <div class='cta-section'>
                <div class='cta-text'>
                    Cảm ơn bạn đã lựa chọn sản phẩm thân thiện với môi trường! 
                </div>
                <span class='eco-badge'>🌍 Eco-Friendly Choice</span>
            </div>
        </div>
        
        <div class='footer'>
            <div class='footer-content'>
                <div class='footer-brand'>🌱 GreenWeave</div>
                <div class='footer-tagline'>Nơi thiên nhiên gặp gỡ thời trang</div>
                <div class='footer-copyright'>© 2024 GreenWeave. Tất cả quyền được bảo lưu.</div>
            </div>
        </div>
    </div>
</body>
</html>";
        }
    }
}