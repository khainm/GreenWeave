// 💬 Consultation Controller
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
    public class ConsultationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ConsultationController> _logger;

        public ConsultationController(
            ApplicationDbContext context,
            ILogger<ConsultationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Create a new consultation request
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ConsultationRequest>> CreateConsultation([FromBody] CreateConsultationDto createDto)
        {
            try
            {
                var consultation = new ConsultationRequest
                {
                    DesignId = createDto.DesignId,
                    ProductId = createDto.ProductId,
                    CustomerName = createDto.CustomerName,
                    PreferredContact = createDto.PreferredContact,
                    Phone = createDto.Phone,
                    Zalo = createDto.Zalo,
                    Facebook = createDto.Facebook,
                    Email = createDto.Email,
                    Notes = createDto.Notes,
                    ProductName = createDto.ProductName,
                    DesignPreview = createDto.DesignPreview,
                    Status = "pending",
                    RequestedAt = DateTime.UtcNow
                };

                _context.ConsultationRequests.Add(consultation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Consultation request created: {ConsultationId}", consultation.Id);

                return CreatedAtAction(nameof(GetConsultationById), new { id = consultation.Id }, consultation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating consultation request");
                return StatusCode(500, new { message = "An error occurred while creating the consultation request" });
            }
        }

        /// <summary>
        /// Get a consultation request by ID
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ConsultationRequest>> GetConsultationById(Guid id)
        {
            try
            {
                var consultation = await _context.ConsultationRequests
                    .Include(c => c.Design)
                    .Include(c => c.Product)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (consultation == null)
                {
                    return NotFound(new { message = "Consultation request not found" });
                }

                return Ok(consultation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving consultation {ConsultationId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the consultation request" });
            }
        }

        /// <summary>
        /// Update consultation status
        /// </summary>
        [HttpPut("{id:guid}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ConsultationRequest>> UpdateStatus(Guid id, [FromBody] UpdateStatusDto updateDto)
        {
            try
            {
                var consultation = await _context.ConsultationRequests.FindAsync(id);
                if (consultation == null)
                {
                    return NotFound(new { message = "Consultation request not found" });
                }

                switch (updateDto.Status.ToLower())
                {
                    case "contacted":
                        consultation.MarkAsContacted(updateDto.StaffMember ?? "Admin");
                        break;
                    case "quoted":
                        if (updateDto.EstimatedPrice.HasValue)
                            consultation.MarkAsQuoted(updateDto.EstimatedPrice.Value);
                        break;
                    case "completed":
                        consultation.MarkAsCompleted();
                        break;
                    case "cancelled":
                        consultation.Cancel(updateDto.Notes ?? "");
                        break;
                    default:
                        consultation.Status = updateDto.Status;
                        break;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Consultation status updated: {ConsultationId} to {Status}", id, updateDto.Status);

                return Ok(consultation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating consultation status {ConsultationId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the consultation status" });
            }
        }

        /// <summary>
        /// Get all consultation requests with pagination
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> GetConsultations(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.ConsultationRequests
                    .Include(c => c.Design)
                    .Include(c => c.Product)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(c => c.Status == status);

                var totalCount = await query.CountAsync();
                var items = await query
                    .OrderByDescending(c => c.RequestedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    items,
                    totalCount,
                    pageNumber = page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving consultation requests");
                return StatusCode(500, new { message = "An error occurred while retrieving consultation requests" });
            }
        }

        /// <summary>
        /// Get pending consultation requests
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<ConsultationRequest>>> GetPendingConsultations()
        {
            try
            {
                var consultations = await _context.ConsultationRequests
                    .Include(c => c.Design)
                    .Include(c => c.Product)
                    .Where(c => c.Status == "pending")
                    .OrderBy(c => c.PriorityLevel == "high" ? 1 : c.PriorityLevel == "medium" ? 2 : 3)
                    .ThenBy(c => c.RequestedAt)
                    .Take(50)
                    .ToListAsync();

                return Ok(consultations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending consultations");
                return StatusCode(500, new { message = "An error occurred while retrieving pending consultations" });
            }
        }

        /// <summary>
        /// Delete a consultation request
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConsultation(Guid id)
        {
            try
            {
                var consultation = await _context.ConsultationRequests.FindAsync(id);
                if (consultation == null)
                {
                    return NotFound(new { message = "Consultation request not found" });
                }

                _context.ConsultationRequests.Remove(consultation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Consultation deleted: {ConsultationId}", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting consultation {ConsultationId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the consultation request" });
            }
        }
    }

    // DTOs for this controller
    public class CreateConsultationDto
    {
        public Guid? DesignId { get; set; }
        public int ProductId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string PreferredContact { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Zalo { get; set; }
        public string? Facebook { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public string? ProductName { get; set; }
        public string? DesignPreview { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? StaffMember { get; set; }
        public decimal? EstimatedPrice { get; set; }
        public string? Notes { get; set; }
    }
}