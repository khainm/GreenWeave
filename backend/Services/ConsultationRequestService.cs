// 📞 Consultation Request Service Implementation
// Production Ready

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.DTOs;
using backend.Interfaces.Services;
using GreenWeave.Models;

namespace backend.Services
{
    public class ConsultationRequestService : IConsultationRequestService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ConsultationRequestService> _logger;
        private readonly IEmailService? _emailService;

        public ConsultationRequestService(
            ApplicationDbContext context,
            ILogger<ConsultationRequestService> logger,
            IEmailService? emailService = null)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task<Guid> CreateRequestAsync(CreateConsultationRequestDto dto)
        {
            try
            {
                _logger.LogInformation("📞 [ConsultationService] Creating request for customer: {CustomerName}", dto.CustomerName);
                _logger.LogInformation("📞 ProductId: {ProductId}, ProductName: {ProductName}", dto.ProductId, dto.ProductName);
                _logger.LogInformation("📞 Contact: {PreferredContact} - Phone: {Phone}, Zalo: {Zalo}, Facebook: {Facebook}", 
                    dto.PreferredContact, dto.Phone, dto.Zalo, dto.Facebook);
                _logger.LogInformation("🖼️ [ConsultationService] DesignPreview URL: {DesignPreview}", 
                    string.IsNullOrEmpty(dto.DesignPreview) ? "NULL/EMPTY!" : dto.DesignPreview);
                
                var request = new ConsultationRequest
                {
                    DesignId = dto.DesignId,
                    ProductId = dto.ProductId,
                    CustomerName = dto.CustomerName,
                    PreferredContact = dto.PreferredContact,
                    Phone = dto.Phone,
                    Zalo = dto.Zalo,
                    Facebook = dto.Facebook,
                    Email = dto.Email,
                    Notes = dto.Notes,
                    ProductName = dto.ProductName,
                    DesignPreview = dto.DesignPreview,
                    Status = "pending",
                    RequestedAt = DateTime.UtcNow
                };

                _context.ConsultationRequests.Add(request);
                
                _logger.LogInformation("💾 [ConsultationService] Saving to database...");
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ [ConsultationService] Consultation request created successfully: {RequestId}", request.Id);
                _logger.LogInformation("✅ [ConsultationService] Saved with DesignPreview: {DesignPreview}", 
                    string.IsNullOrEmpty(request.DesignPreview) ? "NULL/EMPTY!" : request.DesignPreview);

                // Send email notification to admin (optional)
                if (_emailService != null)
                {
                    try
                    {
                        await SendAdminNotificationAsync(request);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ Failed to send email notification for consultation request {RequestId}", request.Id);
                        // Don't fail the request creation if email fails
                    }
                }

                return request.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [ConsultationService] Error creating consultation request - Message: {Message}", ex.Message);
                _logger.LogError("❌ Stack trace: {StackTrace}", ex.StackTrace);
                throw;
            }
        }

        public async Task<ConsultationRequestDto?> GetRequestAsync(Guid id)
        {
            try
            {
                var request = await _context.ConsultationRequests
                    .Include(r => r.Product)
                    .Include(r => r.Design)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    return null;
                }

                return MapToDto(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting consultation request {RequestId}", id);
                throw;
            }
        }

        public async Task<PagedResult<ConsultationRequestDto>> ListRequestsAsync(
            string? status = null,
            string? priorityLevel = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                var query = _context.ConsultationRequests
                    .Include(r => r.Product)
                    .Include(r => r.Design)
                    .AsQueryable();

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(r => r.Status == status);
                }

                // Get all for priority filtering (needs computed property)
                var allRequests = await query.ToListAsync();

                // Filter by priority level
                if (!string.IsNullOrEmpty(priorityLevel))
                {
                    allRequests = allRequests.Where(r => r.PriorityLevel == priorityLevel).ToList();
                }

                // Pagination
                var totalCount = allRequests.Count;
                var items = allRequests
                    .OrderByDescending(r => r.RequestedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(MapToDto)
                    .ToList();

                return new PagedResult<ConsultationRequestDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing consultation requests");
                throw;
            }
        }

        public async Task<bool> UpdateStatusAsync(Guid id, UpdateConsultationStatusDto dto)
        {
            try
            {
                var request = await _context.ConsultationRequests.FindAsync(id);
                if (request == null)
                {
                    _logger.LogWarning("Consultation request not found: {RequestId}", id);
                    return false;
                }

                request.Status = dto.Status;
                request.AssignedTo = dto.AssignedTo;

                if (dto.Status == "contacted" && request.ContactedAt == null)
                {
                    request.ContactedAt = DateTime.UtcNow;
                }

                if (dto.Status == "completed" && request.CompletedAt == null)
                {
                    request.CompletedAt = DateTime.UtcNow;
                }

                if (dto.EstimatedPrice.HasValue)
                {
                    request.EstimatedPrice = dto.EstimatedPrice.Value;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Consultation request status updated: {RequestId} -> {Status}", id, dto.Status);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating consultation request status {RequestId}", id);
                throw;
            }
        }

        public async Task<ConsultationStatistics> GetConsultationStatisticsAsync()
        {
            try
            {
                var requests = await _context.ConsultationRequests.ToListAsync();

                var respondedRequests = requests.Where(r => r.ContactedAt.HasValue).ToList();
                var avgResponseTime = respondedRequests.Any()
                    ? respondedRequests.Average(r => (r.ContactedAt!.Value - r.RequestedAt).TotalHours)
                    : 0;

                var stats = new ConsultationStatistics
                {
                    TotalRequests = requests.Count,
                    PendingRequests = requests.Count(r => r.Status == "pending"),
                    ContactedRequests = requests.Count(r => r.Status == "contacted"),
                    CompletedRequests = requests.Count(r => r.Status == "completed"),
                    PriorityDistribution = requests
                        .GroupBy(r => r.PriorityLevel)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    AverageResponseTime = avgResponseTime
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting consultation statistics");
                throw;
            }
        }

        private ConsultationRequestDto MapToDto(ConsultationRequest request)
        {
            return new ConsultationRequestDto
            {
                Id = request.Id,
                DesignId = request.DesignId,
                ProductId = request.ProductId,
                CustomerName = request.CustomerName,
                PreferredContact = request.PreferredContact,
                Phone = request.Phone,
                Zalo = request.Zalo,
                Facebook = request.Facebook,
                Email = request.Email,
                Notes = request.Notes,
                ProductName = request.ProductName ?? request.Product?.Name,
                DesignPreview = request.DesignPreview,
                EstimatedPrice = request.EstimatedPrice,
                Status = request.Status,
                AssignedTo = request.AssignedTo,
                RequestedAt = request.RequestedAt,
                ContactedAt = request.ContactedAt,
                CompletedAt = request.CompletedAt,
                ContactInfo = request.ContactInfo,
                DaysWaiting = request.DaysWaiting,
                PriorityLevel = request.PriorityLevel
            };
        }

        private async Task SendAdminNotificationAsync(ConsultationRequest request)
        {
            // TODO: Implement email notification to admin
            // This is a placeholder for future email integration
            await Task.CompletedTask;
        }
    }
}
