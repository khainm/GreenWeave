// 🎨 Custom Design DTOs
// Production Ready

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// DTO for creating a new custom design
    /// </summary>
    public class CreateCustomDesignDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string DesignJson { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PreviewUrl { get; set; }

        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }
    }

    /// <summary>
    /// DTO for updating an existing custom design
    /// </summary>
    public class UpdateCustomDesignDto
    {
        [Required]
        public string DesignJson { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PreviewUrl { get; set; }

        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }

        [StringLength(50)]
        public string? Status { get; set; }
    }

    /// <summary>
    /// DTO for custom design response
    /// </summary>
    public class CustomDesignDto
    {
        public Guid Id { get; set; }
        public int ProductId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string DesignJson { get; set; } = string.Empty;
        public string? PreviewUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Product info
        public string? ProductName { get; set; }
        public string? ProductImage { get; set; }

        // Design metadata
        public int ElementCount { get; set; }
        public string ComplexityLevel { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for creating a consultation request
    /// </summary>
    public class CreateConsultationRequestDto
    {
        public Guid? DesignId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string PreferredContact { get; set; } = string.Empty; // phone, zalo, facebook

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Zalo { get; set; }

        [StringLength(200)]
        public string? Facebook { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? ProductName { get; set; }

        [StringLength(500)]
        public string? DesignPreview { get; set; }
    }

    /// <summary>
    /// DTO for consultation request response
    /// </summary>
    public class ConsultationRequestDto
    {
        public Guid Id { get; set; }
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
        public decimal? EstimatedPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AssignedTo { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ContactedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Computed properties
        public string ContactInfo { get; set; } = string.Empty;
        public int DaysWaiting { get; set; }
        public string PriorityLevel { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for updating consultation request status
    /// </summary>
    public class UpdateConsultationStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty; // pending, contacted, quoted, completed, cancelled

        [StringLength(100)]
        public string? AssignedTo { get; set; }

        public decimal? EstimatedPrice { get; set; }
    }

    /// <summary>
    /// Paged result for lists
    /// </summary>
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPrevious => Page > 1;
        public bool HasNext => Page < TotalPages;
    }
}
