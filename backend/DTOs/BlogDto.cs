using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class BlogDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? FeaturedImageUrl { get; set; }
        public string? FeaturedImageAlt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public string? Tags { get; set; }
        public string? Category { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }
    }

    public class CreateBlogDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Excerpt { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? FeaturedImageUrl { get; set; }
        
        [MaxLength(100)]
        public string? FeaturedImageAlt { get; set; }
        
        [Required]
        [RegularExpression("^(draft|published|archived)$", ErrorMessage = "Status must be draft, published, or archived")]
        public string Status { get; set; } = "draft";
        
        [MaxLength(500)]
        public string? Tags { get; set; }
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        [MaxLength(200)]
        public string? MetaTitle { get; set; }
        
        [MaxLength(500)]
        public string? MetaDescription { get; set; }
        
        [MaxLength(200)]
        public string? MetaKeywords { get; set; }
    }

    public class UpdateBlogDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Excerpt { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? FeaturedImageUrl { get; set; }
        
        [MaxLength(100)]
        public string? FeaturedImageAlt { get; set; }
        
        [Required]
        [RegularExpression("^(draft|published|archived)$", ErrorMessage = "Status must be draft, published, or archived")]
        public string Status { get; set; } = "draft";
        
        [MaxLength(500)]
        public string? Tags { get; set; }
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        [MaxLength(200)]
        public string? MetaTitle { get; set; }
        
        [MaxLength(500)]
        public string? MetaDescription { get; set; }
        
        [MaxLength(200)]
        public string? MetaKeywords { get; set; }
    }

    public class BlogListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Excerpt { get; set; }
        public string? FeaturedImageUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public string? Category { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
