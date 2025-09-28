using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Blog
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string Slug { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Excerpt { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? FeaturedImageUrl { get; set; }
        
        [MaxLength(100)]
        public string? FeaturedImageAlt { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "draft"; // draft, published, archived
        
        [Required]
        public string AuthorId { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? AuthorName { get; set; }
        
        [MaxLength(500)]
        public string? Tags { get; set; } // Comma-separated tags
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        public int ViewCount { get; set; } = 0;
        
        public int LikeCount { get; set; } = 0;
        
        public DateTime? PublishedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // SEO fields
        [MaxLength(200)]
        public string? MetaTitle { get; set; }
        
        [MaxLength(500)]
        public string? MetaDescription { get; set; }
        
        [MaxLength(200)]
        public string? MetaKeywords { get; set; }
        
        // Navigation properties
        [ForeignKey("AuthorId")]
        public virtual User Author { get; set; } = null!;
    }
}
