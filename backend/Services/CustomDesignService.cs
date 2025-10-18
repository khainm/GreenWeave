// 🎨 Custom Design Service Implementation
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
    public class CustomDesignService : ICustomDesignService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomDesignService> _logger;

        public CustomDesignService(
            ApplicationDbContext context,
            ILogger<CustomDesignService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Guid> CreateDesignAsync(CreateCustomDesignDto dto)
        {
            try
            {
                var design = new CustomDesign
                {
                    ProductId = dto.ProductId,
                    UserId = dto.UserId,
                    DesignJson = dto.DesignJson,
                    PreviewUrl = dto.PreviewUrl,
                    ThumbnailUrl = dto.ThumbnailUrl,
                    Status = "draft",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.CustomDesigns.Add(design);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Custom design created: {DesignId}", design.Id);
                return design.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating custom design");
                throw;
            }
        }

        public async Task<bool> UpdateDesignAsync(Guid id, UpdateCustomDesignDto dto)
        {
            try
            {
                var design = await _context.CustomDesigns.FindAsync(id);
                if (design == null)
                {
                    _logger.LogWarning("Design not found: {DesignId}", id);
                    return false;
                }

                design.DesignJson = dto.DesignJson;
                design.PreviewUrl = dto.PreviewUrl;
                design.ThumbnailUrl = dto.ThumbnailUrl;
                if (dto.Status != null)
                {
                    design.Status = dto.Status;
                }
                design.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Custom design updated: {DesignId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating custom design {DesignId}", id);
                throw;
            }
        }

        public async Task<CustomDesignDto?> GetDesignAsync(Guid id)
        {
            try
            {
                var design = await _context.CustomDesigns
                    .Include(d => d.Product)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (design == null)
                {
                    return null;
                }

                return new CustomDesignDto
                {
                    Id = design.Id,
                    ProductId = design.ProductId,
                    UserId = design.UserId,
                    DesignJson = design.DesignJson,
                    PreviewUrl = design.PreviewUrl,
                    ThumbnailUrl = design.ThumbnailUrl,
                    Status = design.Status,
                    CreatedAt = design.CreatedAt,
                    UpdatedAt = design.UpdatedAt,
                    ProductName = design.Product?.Name,
                    ProductImage = design.Product?.Images?.FirstOrDefault()?.ImageUrl,
                    ElementCount = design.ElementCount,
                    ComplexityLevel = design.ComplexityLevel
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting custom design {DesignId}", id);
                throw;
            }
        }

        public async Task<List<CustomDesignDto>> GetUserDesignsAsync(string userId)
        {
            try
            {
                var designs = await _context.CustomDesigns
                    .Include(d => d.Product)
                    .Where(d => d.UserId == userId)
                    .OrderByDescending(d => d.UpdatedAt)
                    .ToListAsync();

                return designs.Select(design => new CustomDesignDto
                {
                    Id = design.Id,
                    ProductId = design.ProductId,
                    UserId = design.UserId,
                    DesignJson = design.DesignJson,
                    PreviewUrl = design.PreviewUrl,
                    ThumbnailUrl = design.ThumbnailUrl,
                    Status = design.Status,
                    CreatedAt = design.CreatedAt,
                    UpdatedAt = design.UpdatedAt,
                    ProductName = design.Product?.Name,
                    ProductImage = design.Product?.Images?.FirstOrDefault()?.ImageUrl,
                    ElementCount = design.ElementCount,
                    ComplexityLevel = design.ComplexityLevel
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user designs for {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeleteDesignAsync(Guid id)
        {
            try
            {
                var design = await _context.CustomDesigns.FindAsync(id);
                if (design == null)
                {
                    _logger.LogWarning("Design not found: {DesignId}", id);
                    return false;
                }

                _context.CustomDesigns.Remove(design);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Custom design deleted: {DesignId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting custom design {DesignId}", id);
                throw;
            }
        }

        public async Task<DesignStatistics> GetDesignStatisticsAsync()
        {
            try
            {
                var designs = await _context.CustomDesigns.ToListAsync();

                var stats = new DesignStatistics
                {
                    TotalDesigns = designs.Count,
                    DraftDesigns = designs.Count(d => d.Status == "draft"),
                    SavedDesigns = designs.Count(d => d.Status == "saved"),
                    FinalizedDesigns = designs.Count(d => d.Status == "finalized"),
                    ComplexityDistribution = designs
                        .GroupBy(d => d.ComplexityLevel)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting design statistics");
                throw;
            }
        }
    }
}
