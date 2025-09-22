using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;
using backend.Models;
using System.Text.Json;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for handling shipping provider webhooks
    /// </summary>
    [ApiController]
    [Route("api/shipping/webhook")]
    [Produces("application/json")]
    public class ShippingWebhookController : ControllerBase
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<ShippingWebhookController> _logger;

        public ShippingWebhookController(IShippingService shippingService, ILogger<ShippingWebhookController> logger)
        {
            _shippingService = shippingService;
            _logger = logger;
        }

        /// <summary>
        /// Webhook endpoint for Viettel Post status updates
        /// </summary>
        /// <param name="webhookData">Raw webhook payload from Viettel Post</param>
        /// <returns>Success or failure response</returns>
        /// <response code="200">Webhook processed successfully</response>
        /// <response code="400">Invalid webhook data</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("viettelpost")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ViettelPostWebhook([FromBody] object webhookData)
        {
            try
            {
                var json = JsonSerializer.Serialize(webhookData);
                _logger.LogInformation("Received Viettel Post webhook: {WebhookData}", json);

                var success = await _shippingService.ProcessWebhookAsync(ShippingProvider.ViettelPost, json);

                if (success)
                {
                    _logger.LogInformation("Viettel Post webhook processed successfully");
                    return Ok(new { success = true, message = "Webhook processed successfully" });
                }
                else
                {
                    _logger.LogWarning("Failed to process Viettel Post webhook");
                    return BadRequest(new { success = false, message = "Failed to process webhook" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Viettel Post webhook");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

    }
}
