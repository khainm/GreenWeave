using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public enum OrderStatus
    {
        Pending = 1,     // Chờ xác nhận
        Confirmed = 2,   // Đã xác nhận
        Processing = 3,  // Đang xử lý
        Shipping = 4,    // Đang giao hàng
        Delivered = 5,   // Đã giao hàng
        Cancelled = 6,   // Đã hủy
        Returned = 7     // Đã trả hàng
    }

    public enum PaymentStatus
    {
        Pending = 1,     // Chưa thanh toán
        Paid = 2,        // Đã thanh toán
        Failed = 3,      // Thanh toán thất bại
        Refunded = 4     // Đã hoàn tiền
    }

    public class Order
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public string CustomerId { get; set; } = string.Empty;

        [Required]
        public Guid ShippingAddressId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        [StringLength(500)]
        public string? CancelReason { get; set; }

        // Admin approval fields
        [StringLength(450)] // User ID
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        // Shipping fields
        public ShippingProvider ShippingProvider { get; set; } = ShippingProvider.ViettelPost;
        
        [StringLength(100)]
        public string? ShippingCode { get; set; }
        
        public ShippingStatus ShippingStatus { get; set; } = ShippingStatus.PendingPickup;
        
        /// <summary>
        /// Shipping tracking history and status updates from provider (JSON format)
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? ShippingHistory { get; set; }

        // Navigation properties
        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; } = null!;

        [ForeignKey("ShippingAddressId")]
        public virtual UserAddress ShippingAddress { get; set; } = null!;

        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        
        public virtual ShippingRequest? ShippingRequest { get; set; }
    }
}