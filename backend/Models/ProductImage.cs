using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class ProductImage
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? CloudinaryPublicId { get; set; }
        
        public int SortOrder { get; set; } = 0;
        
        public bool IsPrimary { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Product Product { get; set; } = null!;
    }
}
