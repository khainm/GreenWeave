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
                        // PayOS orderCode is numeric; our order numbers are strings. Convert to string as used earlier when generating order numbers.
                        var orderNumber = orderCodeStr;
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
    }
}
