using backend.Models;
using backend.Interfaces.Services;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    /// <summary>
    /// Service for sending order-related email notifications
    /// </summary>
    public class EmailNotificationService : IEmailNotificationService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailNotificationService> _logger;
        private readonly string _sendGridApiKey;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailNotificationService(
            IConfiguration configuration,
            ILogger<EmailNotificationService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _sendGridApiKey = _configuration["SendGrid:ApiKey"] ?? throw new ArgumentNullException("SendGrid:ApiKey");
            _fromEmail = _configuration["SendGrid:FromEmail"] ?? "no-reply@greenweave.vn";
            _fromName = _configuration["SendGrid:FromName"] ?? "GreenWeave Store";
        }

        /// <summary>
        /// Gửi email xác nhận đơn hàng sau khi order được confirmed
        /// </summary>
        public async Task SendOrderConfirmedEmailAsync(string toEmail, string customerName, string orderNumber, decimal total, string? trackingCode = null)
        {
            try
            {
                var subject = $"✅ Đơn hàng #{orderNumber} đã được xác nhận";
                
                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }}
        .footer {{ background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .order-info {{ background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }}
        .highlight {{ color: #16a34a; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Đơn Hàng Đã Được Xác Nhận!</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            
            <p>Cảm ơn bạn đã đặt hàng tại <strong>GreenWeave</strong>! Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.</p>
            
            <div class='order-info'>
                <h3>📦 Thông tin đơn hàng:</h3>
                <p>
                    <strong>Mã đơn hàng:</strong> <span class='highlight'>#{orderNumber}</span><br>
                    <strong>Tổng tiền:</strong> <span class='highlight'>{total:N0} VNĐ</span><br>
                    {(trackingCode != null ? $"<strong>Mã vận đơn:</strong> <span class='highlight'>{trackingCode}</span><br>" : "")}
                </p>
            </div>

            <p>📍 <strong>Trạng thái:</strong> Đơn hàng đang được đóng gói và chuẩn bị giao cho đơn vị vận chuyển.</p>
            
            <p>🚚 Bạn sẽ nhận được thông báo qua email khi đơn hàng được giao cho đơn vị vận chuyển.</p>
            
            <p style='text-align: center;'>
                <a href='https://greenweave.vn/my-orders' class='button'>Xem Chi Tiết Đơn Hàng</a>
            </p>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ GreenWeave</strong></p>
        </div>
        <div class='footer'>
            <p>📧 Email: support@greenweave.vn | 📞 Hotline: 1900-xxxx</p>
            <p>🌐 Website: <a href='https://greenweave.vn'>greenweave.vn</a></p>
            <p style='color: #999; margin-top: 10px;'>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>";

                await SendEmailAsync(toEmail, customerName, subject, htmlContent);
                _logger.LogInformation("✅ Order confirmed email sent to {Email} for order {OrderNumber}", toEmail, orderNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send order confirmed email to {Email} for order {OrderNumber}", toEmail, orderNumber);
                throw;
            }
        }

        /// <summary>
        /// Gửi email thông báo đơn hàng đang vận chuyển
        /// </summary>
        public async Task SendOrderShippingEmailAsync(string toEmail, string customerName, string orderNumber, string trackingCode, string? carrierName = "Viettel Post")
        {
            try
            {
                var subject = $"🚚 Đơn hàng #{orderNumber} đang được giao đến bạn";
                
                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }}
        .footer {{ background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .tracking-box {{ background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px dashed #2563eb; text-align: center; }}
        .tracking-code {{ font-size: 24px; color: #2563eb; font-weight: bold; letter-spacing: 2px; }}
        .highlight {{ color: #2563eb; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚚 Đơn Hàng Đang Trên Đường!</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            
            <p>Tin vui! Đơn hàng <strong>#{orderNumber}</strong> của bạn đã được giao cho đơn vị vận chuyển <strong>{carrierName}</strong> và đang trên đường đến địa chỉ của bạn.</p>
            
            <div class='tracking-box'>
                <p style='margin: 0; font-size: 14px; color: #666;'>Mã vận đơn của bạn:</p>
                <p class='tracking-code'>{trackingCode}</p>
                <p style='margin: 10px 0 0 0;'>
                    <a href='https://greenweave.vn/my-orders' class='button'>Theo Dõi Đơn Hàng</a>
                </p>
            </div>

            <p>📦 Bạn có thể sử dụng mã vận đơn trên để tra cứu tình trạng giao hàng trên trang web của {carrierName}.</p>
            
            <p>💡 <strong>Lưu ý:</strong></p>
            <ul>
                <li>Vui lòng chuẩn bị sẵn tiền mặt nếu bạn chọn hình thức thanh toán COD</li>
                <li>Kiểm tra kỹ hàng hóa trước khi nhận và thanh toán</li>
                <li>Liên hệ ngay với chúng tôi nếu có bất kỳ vấn đề nào</li>
            </ul>
            
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại GreenWeave! 💚</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ GreenWeave</strong></p>
        </div>
        <div class='footer'>
            <p>📧 Email: support@greenweave.vn | 📞 Hotline: 1900-xxxx</p>
            <p>🌐 Website: <a href='https://greenweave.vn'>greenweave.vn</a></p>
            <p style='color: #999; margin-top: 10px;'>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>";

                await SendEmailAsync(toEmail, customerName, subject, htmlContent);
                _logger.LogInformation("✅ Order shipping email sent to {Email} for order {OrderNumber}", toEmail, orderNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send order shipping email to {Email} for order {OrderNumber}", toEmail, orderNumber);
                throw;
            }
        }

        /// <summary>
        /// Gửi email thông báo giao hàng thành công
        /// </summary>
        public async Task SendOrderDeliveredEmailAsync(string toEmail, string customerName, string orderNumber, decimal total)
        {
            try
            {
                var subject = $"✅ Đơn hàng #{orderNumber} đã được giao thành công";
                
                var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }}
        .footer {{ background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .success-box {{ background-color: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669; }}
        .highlight {{ color: #059669; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Giao Hàng Thành Công!</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{customerName}</strong>,</p>
            
            <div class='success-box'>
                <h3 style='margin-top: 0; color: #059669;'>✅ Đơn hàng #{orderNumber} đã được giao thành công!</h3>
                <p style='margin-bottom: 0;'>Tổng giá trị: <strong>{total:N0} VNĐ</strong></p>
            </div>
            
            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại <strong>GreenWeave</strong>! 💚</p>
            
            <p>Chúng tôi hy vọng bạn hài lòng với sản phẩm. Nếu có bất kỳ vấn đề gì về chất lượng sản phẩm, vui lòng liên hệ với chúng tôi trong vòng 7 ngày để được hỗ trợ đổi trả.</p>
            
            <h3>💡 Bạn có thể:</h3>
            <ul>
                <li>📝 Đánh giá sản phẩm và chia sẻ trải nghiệm của bạn</li>
                <li>🎁 Tham gia chương trình tích điểm và nhận ưu đãi</li>
                <li>🛍️ Khám phá thêm nhiều sản phẩm xanh khác</li>
            </ul>
            
            <p style='text-align: center;'>
                <a href='https://greenweave.vn/products' class='button'>Tiếp Tục Mua Sắm</a>
            </p>
            
            <p>Một lần nữa, cảm ơn bạn đã đồng hành cùng GreenWeave trong hành trình bảo vệ môi trường! 🌱</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ GreenWeave</strong></p>
        </div>
        <div class='footer'>
            <p>📧 Email: support@greenweave.vn | 📞 Hotline: 1900-xxxx</p>
            <p>🌐 Website: <a href='https://greenweave.vn'>greenweave.vn</a></p>
            <p style='color: #999; margin-top: 10px;'>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>";

                await SendEmailAsync(toEmail, customerName, subject, htmlContent);
                _logger.LogInformation("✅ Order delivered email sent to {Email} for order {OrderNumber}", toEmail, orderNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send order delivered email to {Email} for order {OrderNumber}", toEmail, orderNumber);
                throw;
            }
        }

        /// <summary>
        /// Core method to send email via SendGrid
        /// </summary>
        private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress(_fromEmail, _fromName);
            var to = new EmailAddress(toEmail, toName);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, "", htmlContent);
            
            var response = await client.SendEmailAsync(msg);
            
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                _logger.LogError("SendGrid API error: {StatusCode}, Body: {ResponseBody}", response.StatusCode, responseBody);
                throw new Exception($"SendGrid API returned {response.StatusCode}");
            }
        }
    }
}
