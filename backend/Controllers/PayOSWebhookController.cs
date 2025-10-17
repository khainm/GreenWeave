using Microsoft.AspNetCore.Mvc;
using backend.Services;
using Net.payOS.Types;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayOSWebhookController : ControllerBase
    {
        private readonly PayOSService _payosService;
        private readonly backend.Interfaces.Services.IOrderService _orderService;
        private readonly ILogger<PayOSWebhookController> _logger;

        public PayOSWebhookController(PayOSService payosService, backend.Interfaces.Services.IOrderService orderService, ILogger<PayOSWebhookController> logger)
        {
            _payosService = payosService;
            _orderService = orderService;
            _logger = logger;
        }

        /// <summary>
        /// Endpoint này PayOS sẽ gọi (POST) khi có giao dịch thanh toán thành công hoặc bị hủy.
        /// </summary>
    [HttpPost("callback")]
    public async Task<IActionResult> HandleWebhook([FromBody] WebhookType webhookBody)
        {
            try
            {
                if (webhookBody == null)
                {
                    _logger.LogWarning("⚠️ Webhook body is null");
                    return BadRequest("Webhook body is empty");
                }

                // ✅ Xác minh tính hợp lệ của dữ liệu Webhook
                var verifiedData = _payosService.VerifyWebhookData(webhookBody);

                _logger.LogInformation("✅ Webhook verified for order {OrderCode}, status: {Desc}, success: {Success}", 
                    verifiedData.orderCode, verifiedData.desc, webhookBody.success);

                // Check if webhook indicates a successful payment using the official success field
                // According to PayOS docs, webhookBody.success is a boolean that indicates transaction success
                var isSuccess = webhookBody.success && verifiedData.amount > 0;

                backend.DTOs.OrderResponseDto? updatedOrder = null;
                var orderCodeStr = verifiedData.orderCode.ToString();
                if (isSuccess && !string.IsNullOrEmpty(orderCodeStr))
                {
                    try
                    {
                        // PayOS orderCode is numeric (extracted from original OrderNumber like "GW20251016004" → "20251016004")
                        // We need to find the original order by matching the numeric part
                        var orderNumber = await FindOrderNumberByPayOSCodeAsync(orderCodeStr);
                        if (string.IsNullOrEmpty(orderNumber))
                        {
                            _logger.LogWarning("⚠️ Could not find order with PayOS code {OrderCode}", orderCodeStr);
                            return Ok(new { message = "PayOS code processed but order not found", orderCode = verifiedData.orderCode });
                        }

                        updatedOrder = await _orderService.UpdatePaymentStatusFromWebhookAsync(orderNumber, verifiedData.amount, DateTime.UtcNow);
                        
                        if (updatedOrder != null)
                        {
                            _logger.LogInformation("✅ Successfully updated order {OrderNumber} payment status from webhook", orderNumber);
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Order {OrderNumber} not found or could not be updated", orderNumber);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to update order {OrderCode} from webhook", verifiedData.orderCode);
                    }
                }
                else if (!isSuccess)
                {
                    _logger.LogInformation("ℹ️ Webhook for order {OrderCode} indicates unsuccessful payment (success: {Success})", 
                        verifiedData.orderCode, webhookBody.success);
                }

                return Ok(new
                {
                    message = "Webhook processed successfully",
                    orderCode = verifiedData.orderCode,
                    amount = verifiedData.amount,
                    status = verifiedData.desc,
                    success = webhookBody.success,
                    updatedOrder
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error handling webhook");
                return BadRequest(new { error = "Invalid or unverifiable webhook" });
            }
        }

        /// <summary>
        /// Dùng để xác nhận webhook URL với PayOS (PayOS sẽ ping endpoint này khi cấu hình webhook)
        /// </summary>
        [HttpGet("confirm")]
        public async Task<IActionResult> ConfirmWebhook([FromQuery] string url)
        {
            if (string.IsNullOrEmpty(url))
                return BadRequest("Missing webhook URL");

            var result = await _payosService.ConfirmWebhookAsync(url);
            return Ok(new { message = "Webhook confirmed successfully", result });
        }

        /// <summary>
        /// Find the original OrderNumber by PayOS numeric code.
        /// PayOS receives numeric codes (e.g., "20251016004") extracted from our alphanumeric order numbers (e.g., "GW20251016004").
        /// This method reverses the mapping to find the original order.
        /// </summary>
        /// <param name="payosCode">Numeric PayOS code (e.g., "20251016004")</param>
        /// <returns>Full OrderNumber (e.g., "GW20251016004") or null if not found</returns>
        private async Task<string?> FindOrderNumberByPayOSCodeAsync(string payosCode)
        {
            try
            {
                // Strategy 1: Try to reconstruct the order number by adding "GW" prefix
                // Most common case: "20251016004" → "GW20251016004" 
                var reconstructedOrderNumber = $"GW{payosCode}";
                var order = await _orderService.GetOrderByNumberAsync(reconstructedOrderNumber);
                if (order != null)
                {
                    _logger.LogInformation("✅ Found order by reconstruction: {PayOSCode} → {OrderNumber}", 
                        payosCode, reconstructedOrderNumber);
                    return reconstructedOrderNumber;
                }

                // Strategy 2: Search all orders and find one where the numeric part matches
                // This is a fallback for edge cases or different order number formats
                var allOrders = await _orderService.GetAllOrdersAsync();
                foreach (var existingOrder in allOrders)
                {
                    var numericPart = System.Text.RegularExpressions.Regex.Replace(existingOrder.OrderNumber, @"[^\d]", "");
                    if (numericPart == payosCode)
                    {
                        _logger.LogInformation("✅ Found order by numeric matching: {PayOSCode} → {OrderNumber}", 
                            payosCode, existingOrder.OrderNumber);
                        return existingOrder.OrderNumber;
                    }
                }

                _logger.LogWarning("⚠️ No order found for PayOS code: {PayOSCode}", payosCode);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error finding order for PayOS code: {PayOSCode}", payosCode);
                return null;
            }
        }
    }
}
