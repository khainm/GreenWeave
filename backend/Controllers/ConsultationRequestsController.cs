// 📞 Consultation Requests Controller
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
    public class ConsultationRequestsController : ControllerBase
    {
        private readonly IConsultationRequestService _consultationService;
        private readonly ILogger<ConsultationRequestsController> _logger;

        public ConsultationRequestsController(
            IConsultationRequestService consultationService,
            ILogger<ConsultationRequestsController> logger)
        {
            _consultationService = consultationService;
            _logger = logger;
        }

        /// <summary>
        /// Create a new consultation request
        /// POST /api/consultationrequests
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateConsultationRequestDto dto)
        {
            try
            {
                _logger.LogInformation("📞 [ConsultationController] Received consultation request from {CustomerName}", dto.CustomerName);
                _logger.LogInformation("📞 Request details - ProductId: {ProductId}, Contact: {PreferredContact}", 
                    dto.ProductId, dto.PreferredContact);
                
                // Validate ModelState
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    _logger.LogWarning("⚠️ [ConsultationController] Validation failed: {Errors}", string.Join(", ", errors));
                    
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = errors
                    });
                }

                var requestId = await _consultationService.CreateRequestAsync(dto);
                
                _logger.LogInformation("✅ [ConsultationController] Consultation request created: {RequestId}", requestId);

                return Ok(new
                {
                    success = true,
                    data = new { requestId },
                    message = "Consultation request submitted successfully. We will contact you soon!"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [ConsultationController] Error creating consultation request");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to submit consultation request",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get a consultation request by ID
        /// GET /api/consultationrequests/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequest(Guid id)
        {
            try
            {
                var request = await _consultationService.GetRequestAsync(id);

                if (request == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Consultation request not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting consultation request {RequestId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get consultation request"
                });
            }
        }

        /// <summary>
        /// List consultation requests with filtering (Admin only)
        /// GET /api/consultationrequests/admin/list
        /// </summary>
        [HttpGet("admin/list")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ListRequests(
            [FromQuery] string? status = null,
            [FromQuery] string? priorityLevel = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _consultationService.ListRequestsAsync(status, priorityLevel, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing consultation requests");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to list consultation requests"
                });
            }
        }

        /// <summary>
        /// Update consultation request status (Admin only)
        /// PUT /api/consultationrequests/{id}/status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateConsultationStatusDto dto)
        {
            try
            {
                var success = await _consultationService.UpdateStatusAsync(id, dto);

                if (!success)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Consultation request not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Status updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating consultation request status {RequestId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to update status"
                });
            }
        }

        /// <summary>
        /// Get consultation statistics (Admin only)
        /// GET /api/consultationrequests/admin/statistics
        /// </summary>
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _consultationService.GetConsultationStatisticsAsync();

                return Ok(new
                {
                    success = true,
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting consultation statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get statistics"
                });
            }
        }
    }
}
