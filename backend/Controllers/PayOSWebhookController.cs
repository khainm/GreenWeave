using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Cryptography;
using backend.Interfaces.Services;
using backend.Interfaces.Repositories;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayOSWebhookController : ControllerBase
    {
        private readonly ILogger<PayOSWebhookController> _logger;
        private readonly IOrderService _orderService;
        private readonly IConfiguration _config;
        private readonly IWebhookLogRepository _webhookLogRepository;

        public PayOSWebhookController(
            ILogger<PayOSWebhookController> logger,
            IOrderService orderService,
            IConfiguration config,
            IWebhookLogRepository webhookLogRepository)
        {
            _logger = logger;
            _orderService = orderService;
            _config = config;
            _webhookLogRepository = webhookLogRepository;
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveWebhook()
        {
            // Read raw body (for signature verification)
            Request.EnableBuffering();
            string rawBody;
            using (var reader = new StreamReader(Request.Body, System.Text.Encoding.UTF8, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            _logger.LogInformation("📩 Received PayOS webhook raw body: {RawBody}", rawBody);

            // --- Verify HMAC Signature ---
            var checksumKey = _config["PayOS:ChecksumKey"] ?? string.Empty;
            var signatureHeader = Request.Headers["x-payos-signature"].FirstOrDefault();

            if (!string.IsNullOrEmpty(checksumKey) && !string.IsNullOrEmpty(signatureHeader))
            {
                try
                {
                    var keyBytes = System.Text.Encoding.UTF8.GetBytes(checksumKey);
                    using var hmac = new HMACSHA256(keyBytes);
                    var bodyBytes = System.Text.Encoding.UTF8.GetBytes(rawBody);
                    var hash = hmac.ComputeHash(bodyBytes);
                    var expectedSignature = Convert.ToBase64String(hash);

                    if (!string.Equals(signatureHeader, expectedSignature, StringComparison.Ordinal))
                    {
                        _logger.LogWarning("❌ Invalid PayOS signature. Received: {Sig}, Expected: {Expected}", signatureHeader, expectedSignature);
                        return Unauthorized("Invalid signature");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "⚠️ Error verifying PayOS signature");
                    return StatusCode(500, "Signature verification error");
                }
            }
            else
            {
                _logger.LogWarning("⚠️ Missing PayOS signature or checksum key.");
                return Unauthorized("Missing signature");
            }

            // --- Parse Payload ---
            PayOSWebhookPayload? payload;
            try
            {
                payload = JsonSerializer.Deserialize<PayOSWebhookPayload>(rawBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to deserialize PayOS webhook payload");
                return BadRequest("Invalid JSON payload");
            }

            if (payload == null || string.IsNullOrEmpty(payload.OrderCode))
            {
                _logger.LogWarning("⚠️ PayOS webhook missing OrderCode");
                return BadRequest("OrderCode is required");
            }

            // --- Normalize JSON fingerprint for idempotency ---
            string fingerprint;
            try
            {
                var doc = JsonDocument.Parse(rawBody);
                fingerprint = JsonSerializer.Serialize(doc.RootElement, new JsonSerializerOptions { WriteIndented = false });
            }
            catch
            {
                fingerprint = rawBody;
            }

            // --- Check idempotency ---
            try
            {
                var existingLogs = await _webhookLogRepository.GetByOrderNumberAsync(payload.OrderCode);
                if (existingLogs != null && existingLogs.Any(w => w.RawData == fingerprint))
                {
                    _logger.LogInformation("🔁 Duplicate PayOS webhook ignored for {OrderCode}", payload.OrderCode);
                    return Ok();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error checking existing webhook logs for {OrderCode}", payload.OrderCode);
            }

            // --- Create webhook log ---
            var webhookLog = new WebhookLog
            {
                OrderNumber = payload.OrderCode,
                RawData = fingerprint,
                IsSuccess = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                var created = await _webhookLogRepository.AddAsync(webhookLog);

                // --- Process order if paid ---
                if (payload.Status?.ToUpper() == "PAID")
                {
                    var order = await _orderService.GetOrderByNumberAsync(payload.OrderCode);
                    if (order == null)
                    {
                        _logger.LogWarning("⚠️ Order not found for webhook: {OrderCode}", payload.OrderCode);
                        created.ErrorMessage = "Order not found";
                        await _webhookLogRepository.UpdateAsync(created);
                        return NotFound();
                    }

                    await _orderService.ProcessPaymentAsync(order.Id, order.CustomerId);

                    created.IsSuccess = true;
                    created.OrderId = order.Id;
                    created.UpdatedAt = DateTime.UtcNow;
                    await _webhookLogRepository.UpdateAsync(created);

                    _logger.LogInformation("✅ Order {OrderCode} marked as PAID via PayOS webhook", payload.OrderCode);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error processing PayOS webhook for order {OrderCode}", payload.OrderCode);
                return StatusCode(500, "Webhook processing error");
            }
        }
    }

    public class PayOSWebhookPayload
    {
        public string? OrderCode { get; set; }
        public string? Status { get; set; }
        public decimal Amount { get; set; }
    }
}
