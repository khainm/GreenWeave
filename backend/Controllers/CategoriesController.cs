using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _service;
        private readonly ILogger<CategoriesController> _logger;
        public CategoriesController(ICategoryService service, ILogger<CategoriesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? visible, [FromQuery] bool? customizable)
        {
            // If service not supporting filter, do it here temporarily via repository
            // Reuse repository directly would break layering; better to add to service.
            // For speed, we map through service's GetAll then filter.
            var items = await _service.GetAllAsync();
            if (visible.HasValue) items = items.Where(c => c.IsVisible == visible.Value).ToList();
            if (customizable.HasValue) items = items.Where(c => c.IsCustomizable == customizable.Value).ToList();
            return Ok(new { success = true, data = items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound(new { success = false, message = "Không tìm thấy danh mục" });
            return Ok(new { success = true, data = item });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            try
            {
                var item = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, new { success = true, data = item });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category");
                return StatusCode(500, new { success = false, message = "Lỗi khi tạo danh mục" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryDto dto)
        {
            try
            {
                var item = await _service.UpdateAsync(id, dto);
                return Ok(new { success = true, data = item });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {Id}", id);
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật danh mục" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound(new { success = false, message = "Không tìm thấy danh mục" });
            return Ok(new { success = true });
        }
    }
}


