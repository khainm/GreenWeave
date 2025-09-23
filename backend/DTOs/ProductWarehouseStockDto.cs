using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class ProductWarehouseStockDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public Guid WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public int Stock { get; set; }
        public int ReservedStock { get; set; }
        public int AvailableStock { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateProductWarehouseStockDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public Guid WarehouseId { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }
        
        [Range(0, int.MaxValue)]
        public int ReservedStock { get; set; } = 0;
    }

    public class UpdateProductWarehouseStockDto
    {
        [Required]
        [Range(0, int.MaxValue)]
        public int Stock { get; set; }
        
        [Range(0, int.MaxValue)]
        public int ReservedStock { get; set; }
    }

    public class ProductStockSummaryDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public int TotalStock { get; set; }
        public int TotalReservedStock { get; set; }
        public int TotalAvailableStock { get; set; }
        public List<ProductWarehouseStockDto> WarehouseStocks { get; set; } = new();
    }
}
