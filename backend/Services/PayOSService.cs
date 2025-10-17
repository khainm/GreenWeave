using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Net.payOS.Types;

namespace backend.Services
{
    public class PayOSService
    {
        private readonly Net.payOS.PayOS _payos;
        private readonly ILogger<PayOSService> _logger;

        public PayOSService(IConfiguration config, ILogger<PayOSService> logger)
        {
            _logger = logger;

            var clientId = config["PayOS:ClientId"];
            var apiKey = config["PayOS:ApiKey"];
            var checksumKey = config["PayOS:ChecksumKey"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(checksumKey))
            {
                _logger.LogError("❌ Missing PayOS credentials in configuration. ClientId: {ClientId}, ApiKey: {ApiKey}, ChecksumKey: {ChecksumKey}", 
                    !string.IsNullOrEmpty(clientId) ? "[SET]" : "[MISSING]",
                    !string.IsNullOrEmpty(apiKey) ? "[SET]" : "[MISSING]",
                    !string.IsNullOrEmpty(checksumKey) ? "[SET]" : "[MISSING]");
                throw new ArgumentException("❌ Missing PayOS credentials in configuration.");
            }

            try
            {
                _payos = new Net.payOS.PayOS(clientId, apiKey, checksumKey);
                _logger.LogInformation("✅ PayOS SDK initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to initialize PayOS SDK");
                throw;
            }
        }

        // ✅ Tạo link thanh toán
        public async Task<string> CreatePaymentLinkAsync(decimal amount, string orderCode, string description, string returnUrl, string? cancelUrl = null)
        {
            try
            {
                // Validate input parameters according to PayOS SDK requirements
                if (string.IsNullOrEmpty(orderCode))
                    throw new ArgumentException("OrderCode cannot be null or empty");
                if (amount <= 0)
                    throw new ArgumentException("Amount must be greater than 0");
                if (string.IsNullOrEmpty(description))
                    throw new ArgumentException("Description cannot be null or empty");
                if (string.IsNullOrEmpty(returnUrl))
                    throw new ArgumentException("ReturnUrl cannot be null or empty");

                // Extract numeric part from order code for PayOS compatibility
                // PayOS requires pure numeric orderCode (long), but our system uses alphanumeric format like "GW20251016005"
                _logger.LogInformation("🔄 Processing PayOS payment for OrderCode: '{OrderCode}'", orderCode);
                
                var numericOrderCode = ExtractNumericOrderCode(orderCode);
                _logger.LogInformation("🔢 Extracted numeric code: '{NumericCode}' from OrderCode: '{OrderCode}'", numericOrderCode, orderCode);
                
                if (!long.TryParse(numericOrderCode, out long orderCodeLong))
                {
                    _logger.LogError("❌ Failed to parse numeric code '{NumericCode}' to long from OrderCode '{OrderCode}'", numericOrderCode, orderCode);
                    throw new ArgumentException($"Could not extract valid numeric code from OrderCode '{orderCode}'. Extracted: '{numericOrderCode}'");
                }
                
                _logger.LogInformation("✅ Successfully parsed OrderCode '{OrderCode}' to PayOS numeric code: {PayOSCode}", orderCode, orderCodeLong);

                // ✅ Fix: Shorten description to meet PayOS 25-character limit
                var shortDescription = description.Length > 25 ? description.Substring(0, 22) + "..." : description;
                
                var items = new List<ItemData>
                {
                    new ItemData($"DH #{orderCode}", 1, (int)amount)  // Shortened item description too
                };

                var paymentData = new PaymentData(
                    orderCodeLong,
                    (int)amount,
                    shortDescription,  // Use shortened description
                    items,
                    cancelUrl ?? returnUrl,
                    returnUrl
                );

                CreatePaymentResult result = await _payos.createPaymentLink(paymentData);
                _logger.LogInformation("✅ Created PayOS payment link: {Url} for order {OrderCode} (PayOS code: {PayOSCode})", 
                    result.checkoutUrl, orderCode, orderCodeLong);
                return result.checkoutUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating PayOS payment link for order {OrderCode}", orderCode);
                throw;
            }
        }

        // ✅ Lấy thông tin thanh toán
        public async Task<PaymentLinkInformation> GetPaymentLinkInfoAsync(long orderCode)
        {
            try
            {
                var info = await _payos.getPaymentLinkInformation(orderCode);
                _logger.LogInformation("✅ Retrieved payment info for order {OrderCode}: {Status}", orderCode, info.status);
                return info;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting PayOS payment info for order {OrderCode}", orderCode);
                throw;
            }
        }

        // ✅ Hủy link thanh toán
        public async Task<PaymentLinkInformation> CancelPaymentLinkAsync(long orderCode, string? reason = null)
        {
            try
            {
                var info = await _payos.cancelPaymentLink(orderCode, reason ?? "User canceled");
                _logger.LogInformation("⚠️ Payment link for order {OrderCode} canceled. Reason: {Reason}", orderCode, reason);
                return info;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error canceling PayOS payment link for order {OrderCode}", orderCode);
                throw;
            }
        }

        // ✅ Đăng ký hoặc xác thực webhook
        public async Task<string> ConfirmWebhookAsync(string webhookUrl)
        {
            try
            {
                var result = await _payos.confirmWebhook(webhookUrl);
                _logger.LogInformation("✅ Webhook confirmed at: {Url}", webhookUrl);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error confirming webhook at {Url}", webhookUrl);
                throw;
            }
        }

        // ✅ Xác minh dữ liệu webhook
        public WebhookData VerifyWebhookData(WebhookType webhookBody)
        {
            try
            {
                var data = _payos.verifyPaymentWebhookData(webhookBody);
                _logger.LogInformation("✅ Webhook verified for order {OrderCode}, success: {Success}", 
                    data.orderCode, webhookBody.success);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Invalid webhook data received");
                throw;
            }
        }

        /// <summary>
        /// Extract numeric part from order code for PayOS compatibility.
        /// PayOS requires pure numeric orderCode (long), but our system uses alphanumeric format.
        /// </summary>
        /// <param name="orderCode">Original order code (e.g., "GW20251016005")</param>
        /// <returns>Numeric part as string (e.g., "20251016005")</returns>
        private string ExtractNumericOrderCode(string orderCode)
        {
            try
            {
                // Use regex to extract all digits from the order code
                var numericPart = System.Text.RegularExpressions.Regex.Replace(orderCode, @"[^\d]", "");
                
                if (string.IsNullOrEmpty(numericPart))
                {
                    // Fallback: generate timestamp-based code if no digits found
                    var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    _logger.LogWarning("⚠️ No numeric part found in OrderCode '{OrderCode}', using timestamp fallback: {Timestamp}", 
                        orderCode, timestamp);
                    return timestamp.ToString();
                }

                // Ensure the numeric code is not too long for long type (max 19 digits)
                if (numericPart.Length > 18)
                {
                    numericPart = numericPart.Substring(numericPart.Length - 18);
                    _logger.LogWarning("⚠️ Numeric part too long, truncated to: {NumericCode}", numericPart);
                }

                _logger.LogInformation("✅ Extracted numeric code '{NumericCode}' from OrderCode '{OrderCode}'", 
                    numericPart, orderCode);
                return numericPart;
            }
            catch (Exception ex)
            {
                // Last resort fallback
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                _logger.LogError(ex, "❌ Error extracting numeric code from '{OrderCode}', using timestamp fallback: {Timestamp}", 
                    orderCode, timestamp);
                return timestamp.ToString();
            }
        }
    }
}
