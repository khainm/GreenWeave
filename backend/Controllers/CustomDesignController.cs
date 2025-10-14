// 🎨 Custom Design Controller
// Senior Backend Engineer - Simple and Production Ready

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using GreenWeave.Models;

namespace GreenWeave.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomDesignController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomDesignController> _logger;

        public CustomDesignController(
            ApplicationDbContext context,
            ILogger<CustomDesignController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Save a new custom design
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CustomDesign>> SaveDesign([FromBody] SaveDesignDto saveDto)
        {
            try
            {
                var design = new CustomDesign
                {
                    ProductId = saveDto.ProductId,
                    UserId = saveDto.UserId ?? "guest",
                    DesignJson = saveDto.DesignJson,
                    PreviewUrl = saveDto.PreviewUrl,
                    Status = "saved",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.CustomDesigns.Add(design);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Design saved: {DesignId} for product {ProductId}", design.Id, saveDto.ProductId);

                return CreatedAtAction(nameof(GetDesignById), new { id = design.Id }, design);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving custom design");
                return StatusCode(500, new { message = "An error occurred while saving the design" });
            }
        }

        /// <summary>
        /// Get a custom design by ID
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CustomDesign>> GetDesignById(Guid id)
        {
            try
            {
                var design = await _context.CustomDesigns
                    .Include(d => d.Product)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (design == null)
                {
                    return NotFound(new { message = "Design not found" });
                }

                return Ok(design);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving design {DesignId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the design" });
            }
        }

        /// <summary>
        /// Update an existing custom design
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<CustomDesign>> UpdateDesign(Guid id, [FromBody] UpdateDesignDto updateDto)
        {
            try
            {
                var design = await _context.CustomDesigns.FindAsync(id);
                if (design == null)
                {
                    return NotFound(new { message = "Design not found" });
                }

                design.DesignJson = updateDto.DesignJson;
                design.PreviewUrl = updateDto.PreviewUrl ?? design.PreviewUrl;
                design.Status = updateDto.Status ?? design.Status;
                design.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Design updated: {DesignId}", id);

                return Ok(design);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating design {DesignId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the design" });
            }
        }

        /// <summary>
        /// Get designs for a specific product
        /// </summary>
        [HttpGet("product/{productId:int}")]
        public async Task<ActionResult<List<CustomDesign>>> GetProductDesigns(int productId, [FromQuery] int limit = 10)
        {
            try
            {
                var designs = await _context.CustomDesigns
                    .Include(d => d.Product)
                    .Where(d => d.ProductId == productId && d.Status == "finalized")
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                return Ok(designs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product designs for {ProductId}", productId);
                return StatusCode(500, new { message = "An error occurred while retrieving product designs" });
            }
        }

        /// <summary>
        /// Get designs for a specific user
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<CustomDesign>>> GetUserDesigns(string userId, [FromQuery] int limit = 10)
        {
            try
            {
                var designs = await _context.CustomDesigns
                    .Include(d => d.Product)
                    .Where(d => d.UserId == userId)
                    .OrderByDescending(d => d.UpdatedAt)
                    .Take(limit)
                    .ToListAsync();

                return Ok(designs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user designs for {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving user designs" });
            }
        }

        /// <summary>
        /// Delete a custom design
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteDesign(Guid id, [FromQuery] string userId)
        {
            try
            {
                var design = await _context.CustomDesigns
                    .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

                if (design == null)
                {
                    return NotFound(new { message = "Design not found or access denied" });
                }

                _context.CustomDesigns.Remove(design);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Design deleted: {DesignId}", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting design {DesignId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the design" });
            }
        }

        /// <summary>
        /// Get customizable products
        /// </summary>
        [HttpGet("products")]
        public async Task<ActionResult<List<object>>> GetCustomizableProducts()
        {
            try
            {
                var products = await _context.Products
                    .Where(p => p.CategoryId > 0) // Simple filter instead of complex conditions
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Description,
                        p.Price,
                        Images = p.Images.Take(1).Select(i => i.ImageUrl).ToList(),
                        Colors = p.Colors.Select(c => new { c.ColorCode, c.ColorName }).ToList()
                    })
                    .ToListAsync();

                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customizable products");
                return StatusCode(500, new { message = "An error occurred while retrieving products" });
            }
        }
    }

    // DTOs for this controller
    public class SaveDesignDto
    {
        public int ProductId { get; set; }
        public string? UserId { get; set; }
        public string DesignJson { get; set; } = string.Empty;
        public string? PreviewUrl { get; set; }
    }

    public class UpdateDesignDto
    {
        public string DesignJson { get; set; } = string.Empty;
        public string? PreviewUrl { get; set; }
        public string? Status { get; set; }
    }
}