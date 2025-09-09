using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/custom")] 
    public class CustomController : ControllerBase
    {
        private readonly ICustomService _service;
        public CustomController(ICustomService service) { _service = service; }

        [HttpGet("base-products")]
        public async Task<IActionResult> ListBaseProducts([FromQuery] int? categoryId)
        {
            var list = await _service.ListBaseProductsAsync(categoryId);
            return Ok(new { success = true, data = list });
        }

        [HttpGet("base-products/{id}")]
        public async Task<IActionResult> GetBaseProduct(int id)
        {
            var p = await _service.GetBaseProductAsync(id);
            if (p == null) return NotFound(new { success = false, message = "Không tìm thấy sản phẩm cơ sở" });
            return Ok(new { success = true, data = p });
        }

        [HttpPost("designs")]
        public async Task<IActionResult> CreateDesign([FromBody] CreateCustomDesignRequest request)
        {
            var id = await _service.CreateDesignAsync(request);
            return Ok(new { success = true, data = new { id } });
        }

        [HttpGet("designs/{id}")]
        public async Task<IActionResult> GetDesign(Guid id)
        {
            var d = await _service.GetDesignRawAsync(id);
            if (d == null) return NotFound(new { success = false });
            return Ok(new { success = true, data = d });
        }
    }
}


