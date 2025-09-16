using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum InvoiceStatus
    {
        Generated = 1,    // Đã tạo
        Sent = 2,        // Đã gửi email
        Failed = 3       // Gửi thất bại
    }

    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int OrderId { get; set; }

        [Required]
        [StringLength(255)]
        public string CustomerEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [StringLength(15)]
        public string? CustomerPhone { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Generated;

        [StringLength(500)]
        public string? FilePath { get; set; }

        [StringLength(100)]
        public string? FileName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SentAt { get; set; }

        [StringLength(500)]
        public string? ErrorMessage { get; set; }

        // Navigation properties
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;
    }
}