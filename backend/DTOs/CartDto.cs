using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CartDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<CartItemDto> Items { get; set; } = new();
        public decimal Total => Items.Sum(i => i.UnitPrice * i.Quantity);
    }

    public class CartItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ColorCode { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class AddCartItemRequest
    {
        [Required] public int ProductId { get; set; }
        public string? ColorCode { get; set; }
        [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
        [Range(0, double.MaxValue)] public decimal UnitPrice { get; set; }
    }

    public class UpdateCartItemRequest
    {
        [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
    }
}


