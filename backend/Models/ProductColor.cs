using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class ProductColor
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [MaxLength(7)] // #FFFFFF format
        public string ColorCode { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string? ColorName { get; set; }
        
        public int SortOrder { get; set; } = 0;
        
        // Navigation property
        public Product Product { get; set; } = null!;
    }
}
