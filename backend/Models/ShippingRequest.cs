using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Represents a shipping request for an order
    /// </summary>
    public class ShippingRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public ShippingProvider Provider { get; set; }

        /// <summary>
        /// Service type ID from the shipping provider (e.g., "VCN" for Viettel Post)
        /// </summary>
        [StringLength(50)]
        public string? ServiceId { get; set; }

        /// <summary>
        /// Pickup address details (JSON format)
        /// </summary>
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string FromAddress { get; set; } = string.Empty;

        /// <summary>
        /// Delivery address details (JSON format)
        /// </summary>
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string ToAddress { get; set; } = string.Empty;

        /// <summary>
        /// Package weight in grams
        /// </summary>
        [Range(1, int.MaxValue)]
        public int Weight { get; set; }

        /// <summary>
        /// Package dimensions in cm (JSON format: {length, width, height})
        /// </summary>
        [Column(TypeName = "nvarchar(500)")]
        public string? Dimensions { get; set; }

        /// <summary>
        /// Calculated shipping fee
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Fee { get; set; }

        /// <summary>
        /// Insurance value
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal InsuranceValue { get; set; } = 0;

        /// <summary>
        /// Cash on delivery amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal CodAmount { get; set; } = 0;

        /// <summary>
        /// Special delivery instructions
        /// </summary>
        [StringLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Request status
        /// </summary>
        public ShippingStatus Status { get; set; } = ShippingStatus.PendingPickup;

        /// <summary>
        /// Tracking code from shipping provider
        /// </summary>
        [StringLength(100)]
        public string? TrackingCode { get; set; }

        /// <summary>
        /// External reference ID from shipping provider
        /// </summary>
        [StringLength(100)]
        public string? ExternalId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the package was picked up
        /// </summary>
        public DateTime? PickedAt { get; set; }

        /// <summary>
        /// When the package was delivered
        /// </summary>
        public DateTime? DeliveredAt { get; set; }

        /// <summary>
        /// When the shipping was cancelled
        /// </summary>
        public DateTime? CancelledAt { get; set; }

        /// <summary>
        /// Cancellation reason
        /// </summary>
        [StringLength(500)]
        public string? CancelReason { get; set; }

        // Navigation properties
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        public virtual ICollection<ShippingTransaction> Transactions { get; set; } = new List<ShippingTransaction>();
    }
}
