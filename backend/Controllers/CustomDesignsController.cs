// 🎨 Custom Designs Controller
// Production Ready

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Interfaces.Services;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomDesignsController : ControllerBase
    {
        private readonly ICustomDesignService _designService;
        private readonly ILogger<CustomDesignsController> _logger;

        public CustomDesignsController(
            ICustomDesignService designService,
            ILogger<CustomDesignsController> logger)
        {
            _designService = designService;
            _logger = logger;
        }

        /// <summary>
        /// Create a new custom design
        /// POST /api/customdesigns
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateDesign([FromBody] CreateCustomDesignDto dto)
        {
            try
            {
                var designId = await _designService.CreateDesignAsync(dto);

                return Ok(new
                {
                    success = true,
                    data = new { designId },
                    message = "Design created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating design");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to create design"
                });
            }
        }

        /// <summary>
        /// Update an existing custom design
        /// PUT /api/customdesigns/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDesign(Guid id, [FromBody] UpdateCustomDesignDto dto)
        {
            try
            {
                var success = await _designService.UpdateDesignAsync(id, dto);

                if (!success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Design not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Design updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating design {DesignId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to update design"
                });
            }
        }

        /// <summary>
        /// Get a custom design by ID
        /// GET /api/customdesigns/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDesign(Guid id)
        {
            try
            {
                var design = await _designService.GetDesignAsync(id);

                if (design == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Design not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = design
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting design {DesignId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get design"
                });
            }
        }

        /// <summary>
        /// Get all designs for a user
        /// GET /api/customdesigns/user/{userId}
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserDesigns(string userId)
        {
            try
            {
                var designs = await _designService.GetUserDesignsAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = designs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user designs for {UserId}", userId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get user designs"
                });
            }
        }

        /// <summary>
        /// Delete a custom design
        /// DELETE /api/customdesigns/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesign(Guid id)
        {
            try
            {
                var success = await _designService.DeleteDesignAsync(id);

                if (!success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Design not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Design deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting design {DesignId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to delete design"
                });
            }
        }

        /// <summary>
        /// Get design statistics (Admin only)
        /// GET /api/customdesigns/admin/statistics
        /// </summary>
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _designService.GetDesignStatisticsAsync();

                return Ok(new
                {
                    success = true,
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting design statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get statistics"
                });
            }
        }
    }
}
