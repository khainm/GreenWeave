using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CartItem
    {
        public int Id { get; set; }
        [Required]
        public Guid CartId { get; set; }
        [Required]
        public int ProductId { get; set; }
        public string? ColorCode { get; set; }
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Cart Cart { get; set; } = null!;
    }
}


