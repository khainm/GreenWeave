using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _service;
        public CartController(ICartService service) { _service = service; }

        [HttpPost]
        public async Task<IActionResult> Create()
        {
            var cart = await _service.CreateAsync();
            return Ok(new { success = true, data = cart });
        }

        [HttpGet("{cartId}")]
        public async Task<IActionResult> Get(Guid cartId)
        {
            var cart = await _service.GetAsync(cartId);
            if (cart == null) return NotFound(new { success = false, message = "Không tìm thấy giỏ hàng" });
            return Ok(new { success = true, data = cart });
        }

        [HttpPost("{cartId}/items")]
        public async Task<IActionResult> AddItem(Guid cartId, [FromBody] AddCartItemRequest request)
        {
            var item = await _service.AddItemAsync(cartId, request);
            return Ok(new { success = true, data = item });
        }

        [HttpPut("{cartId}/items/{itemId}")]
        public async Task<IActionResult> UpdateItem(Guid cartId, int itemId, [FromBody] UpdateCartItemRequest request)
        {
            var item = await _service.UpdateItemQuantityAsync(cartId, itemId, request.Quantity);
            if (item == null) return NotFound(new { success = false, message = "Không tìm thấy sản phẩm trong giỏ" });
            return Ok(new { success = true, data = item });
        }

        [HttpDelete("{cartId}/items/{itemId}")]
        public async Task<IActionResult> RemoveItem(Guid cartId, int itemId)
        {
            var ok = await _service.RemoveItemAsync(cartId, itemId);
            if (!ok) return NotFound(new { success = false, message = "Không tìm thấy sản phẩm trong giỏ" });
            return Ok(new { success = true });
        }
    }
}


