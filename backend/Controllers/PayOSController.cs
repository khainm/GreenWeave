using backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayOSController : ControllerBase
    {
        private readonly PayOSService _payosService;

        public PayOSController(PayOSService payosService)
        {
            _payosService = payosService;
        }

        [HttpPost("create-payment-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest request)
        {
            if (string.IsNullOrEmpty(request.OrderId) || string.IsNullOrEmpty(request.Description) || string.IsNullOrEmpty(request.ReturnUrl))
            {
                return BadRequest("OrderId, Description, and ReturnUrl are required.");
            }
            var paymentUrl = await _payosService.CreatePaymentLinkAsync(request.Amount, request.OrderId!, request.Description!, request.ReturnUrl!);
            return Ok(new { paymentUrl });
        }
    }

    public class CreatePaymentRequest
    {
    public decimal Amount { get; set; }
    public string? OrderId { get; set; }
    public string? Description { get; set; }
    public string? ReturnUrl { get; set; }
    }
}
