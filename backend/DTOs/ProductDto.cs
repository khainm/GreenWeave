using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CreateProductDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Sku { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal Price { get; set; }
        
        [Range(0, double.MaxValue, ErrorMessage = "Giá gốc phải lớn hơn 0")]
        public decimal? OriginalPrice { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho phải lớn hơn hoặc bằng 0")]
        public int Stock { get; set; }
        
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Khối lượng phải lớn hơn hoặc bằng 0 gram")]
        public decimal Weight { get; set; }
        
        // Primary warehouse field
        public Guid? PrimaryWarehouseId { get; set; }
        
        [Required]
        public string Status { get; set; } = "active";
        
        public List<string> Colors { get; set; } = new();
        
        // For image URLs (if provided directly)
        public List<string>? ImageUrls { get; set; }

        // Optional mapping: color code -> image URL (nếu gửi trực tiếp)
        public Dictionary<string, string>? ColorImageMap { get; set; }

        // Stickers (URLs) optional
        public List<string>? StickerUrls { get; set; }
        
        // Stickers from placedStickers (from frontend)
        public List<ProductStickerDto>? Stickers { get; set; }
    }
    
    public class ProductImageUploadDto
    {
        public IFormFile? File { get; set; }
        public string? Url { get; set; }
        public bool IsPrimary { get; set; } = false;
    }
    
    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int Stock { get; set; }
        public decimal Weight { get; set; }
        public string Status { get; set; } = string.Empty;
        
        // Primary warehouse fields
        public string? PrimaryWarehouseId { get; set; }
        public string? PrimaryWarehouseName { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public List<ProductImageDto> Images { get; set; } = new();
        public List<ProductColorDto> Colors { get; set; } = new();
        public List<ProductStickerDto> Stickers { get; set; } = new();
        // tiện ích: map màu -> ảnh nếu có
        public Dictionary<string, string> ColorImageMap => Images
            .Where(i => !string.IsNullOrEmpty(i.ColorCode))
            .GroupBy(i => i.ColorCode!.ToLower())
            .ToDictionary(g => g.Key, g => g.OrderBy(i => i.SortOrder).First().ImageUrl);
    }
    
    public class ProductImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsPrimary { get; set; }
        public string? ColorCode { get; set; }
    }
    
    public class ProductColorDto
    {
        public int Id { get; set; }
        public string ColorCode { get; set; } = string.Empty;
        public string? ColorName { get; set; }
        public int SortOrder { get; set; }
    }

    public class ProductStickerDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }
}
