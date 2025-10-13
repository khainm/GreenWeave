using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;
using backend.Models;
using System.Text.Json;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for handling shipping provider webhooks (ViettelPost)
    /// </summary>
    [ApiController]
    [Route("api/webhook/viettelpost")]
    public class ViettelPostWebhookController : ControllerBase
    {
        private readonly IShippingService _shippingService;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
        private readonly ILogger<ViettelPostWebhookController> _logger;

        public ViettelPostWebhookController(IShippingService shippingService, Microsoft.Extensions.Configuration.IConfiguration config, ILogger<ViettelPostWebhookController> logger)
        {
            _shippingService = shippingService;
            _config = config;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            // Read raw body
            Request.EnableBuffering();
            string rawBody;
            using (var reader = new System.IO.StreamReader(Request.Body, System.Text.Encoding.UTF8, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            _logger.LogInformation("Received ViettelPost webhook: {RawBody}", rawBody);

            // Try to deserialize to known DTO
            ViettelPostWebhookData? payload = null;
            try
            {
                payload = JsonSerializer.Deserialize<ViettelPostWebhookData>(rawBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize ViettelPost webhook payload");
                // continue; payload may be null
            }

            // Verify token if configured
            var configuredSecret = _config.GetSection("Shipping")["ViettelPost:WebhookSecret"] ?? _config.GetSection("Shipping:ViettelPost")["WebhookSecret"] ?? string.Empty;
            if (!string.IsNullOrEmpty(configuredSecret))
            {
                var incomingToken = payload?.TOKEN ?? string.Empty;
                if (string.IsNullOrEmpty(incomingToken) || incomingToken != configuredSecret)
                {
                    _logger.LogWarning("ViettelPost webhook token mismatch. Incoming: {Incoming}, Configured present: true", incomingToken);
                    return Unauthorized();
                }
            }

            // Delegate processing to ShippingService which handles parsing, updating order and logging
            try
            {
                var processed = await _shippingService.ProcessWebhookAsync(ShippingProvider.ViettelPost, rawBody);
                if (processed)
                {
                    return Ok();
                }
                else
                {
                    // Processing failed but not necessarily unauthorized
                    _logger.LogWarning("ViettelPost webhook processing returned false for payload: {OrderPreview}", payload?.DATA?.ORDER_NUMBER);
                    return BadRequest();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing ViettelPost webhook");
                return StatusCode(500, "Error processing webhook");
            }
        }
    }

}
