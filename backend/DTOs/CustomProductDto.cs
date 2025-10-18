using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// Response DTO for customizable products with full details
    /// </summary>
    public class CustomProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Regular product fields (nullable for custom products)
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int? Stock { get; set; }
        public decimal? Weight { get; set; }
        
        // Custom product fields
        public string? ConsultationNote { get; set; }
        
        public string Status { get; set; } = string.Empty;
        
        public string? PrimaryWarehouseId { get; set; }
        public string? PrimaryWarehouseName { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Extended properties specific to customizable products
        public List<ProductImageDto> Images { get; set; } = new();
        public List<ProductColorDto> Colors { get; set; } = new();
        // Removed: Stickers - use Sticker Library instead
        
        /// <summary>
        /// Map of color code to image URL for quick lookup
        /// </summary>
        public Dictionary<string, string> ColorImageMap => Images
            .Where(i => !string.IsNullOrEmpty(i.ColorCode))
            .GroupBy(i => i.ColorCode!.ToLower())
            .ToDictionary(g => g.Key, g => g.OrderBy(i => i.SortOrder).First().ImageUrl);
        
        /// <summary>
        /// Indicates if the product has customization options
        /// </summary>
        public bool HasCustomizationOptions => Colors.Any();
        
        /// <summary>
        /// Count of available customization options
        /// </summary>
        public int CustomizationOptionsCount => Colors.Count;
    }
    
    /// <summary>
    /// Request DTO for creating custom products
    /// </summary>
    public class CreateCustomProductDto
    {
        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "SKU là bắt buộc")]
        [MaxLength(50)]
        public string Sku { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        // Optional for custom products - not needed for consultation-based custom products
        [Range(0, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal? Price { get; set; }
        
        [Range(0, double.MaxValue, ErrorMessage = "Giá gốc phải lớn hơn 0")]
        public decimal? OriginalPrice { get; set; }
        
        // Optional for custom products - stock managed through consultation process
        [Range(0, int.MaxValue, ErrorMessage = "Tồn kho phải lớn hơn hoặc bằng 0")]
        public int? Stock { get; set; }
        
        // Optional for custom products - weight determined during consultation
        [Range(0, double.MaxValue, ErrorMessage = "Khối lượng phải lớn hơn 0 gram")]
        public decimal? Weight { get; set; }
        
        public Guid? PrimaryWarehouseId { get; set; }
        
        [Required]
        public string Status { get; set; } = "active";
        
        // Customization specific fields
        [Required(ErrorMessage = "Sản phẩm custom phải có ít nhất một màu")]
        [MinLength(1, ErrorMessage = "Phải có ít nhất một màu")]
        public List<string> Colors { get; set; } = new();
        
        public List<string>? ImageUrls { get; set; }
        public Dictionary<string, string>? ColorImageMap { get; set; }
        
        // Stickers removed - using external Sticker Library instead
    }
    
    /// <summary>
    /// Request DTO for updating custom products
    /// </summary>
    public class UpdateCustomProductDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? OriginalPrice { get; set; }
        
        [Range(0, int.MaxValue)]
        public int? Stock { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? Weight { get; set; }
        
        public Guid? PrimaryWarehouseId { get; set; }
        public string? Status { get; set; }
        
        // Customization updates
        public List<string>? Colors { get; set; }
        public List<string>? ImageUrls { get; set; }
        public Dictionary<string, string>? ColorImageMap { get; set; }
        // Stickers removed - using external Sticker Library instead
    }
}
