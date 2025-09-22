using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Product
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Sku { get; set; } = string.Empty;
        
        // Backward-compat string category label for display/filtering
        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        // Strong FK to Category for relational integrity (optional to preserve legacy data)
        public int? CategoryId { get; set; }
        public Category? CategoryRef { get; set; }
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? OriginalPrice { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }
        
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Khối lượng phải lớn hơn hoặc bằng 0 gram")]
        public decimal Weight { get; set; } // Khối lượng sản phẩm (gram)
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "active"; // active, inactive
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<ProductColor> Colors { get; set; } = new List<ProductColor>();
        public ICollection<ProductSticker> Stickers { get; set; } = new List<ProductSticker>();
    }
}
