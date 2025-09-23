using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class ProductWarehouseStock
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public Guid WarehouseId { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int ReservedStock { get; set; } = 0; // Stock đã được đặt hàng nhưng chưa ship
        
        public int AvailableStock => Stock - ReservedStock; // Stock có thể bán
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
        
        [ForeignKey("WarehouseId")]
        public virtual Warehouse Warehouse { get; set; } = null!;
    }
}
