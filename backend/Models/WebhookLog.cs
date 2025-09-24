using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Represents a webhook log entry from ViettelPost
    /// </summary>
    public class WebhookLog
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Order number from ViettelPost
        /// </summary>
        [Required]
        [StringLength(250)]
        public string OrderNumber { get; set; } = string.Empty;

        /// <summary>
        /// Partner order reference
        /// </summary>
        [StringLength(250)]
        public string OrderReference { get; set; } = string.Empty;

        /// <summary>
        /// Status date from ViettelPost
        /// </summary>
        [StringLength(250)]
        public string OrderStatusDate { get; set; } = string.Empty;

        /// <summary>
        /// Order status code
        /// </summary>
        public int OrderStatus { get; set; }

        /// <summary>
        /// Status description
        /// </summary>
        [StringLength(500)]
        public string StatusDescription { get; set; } = string.Empty;

        /// <summary>
        /// Note from ViettelPost
        /// </summary>
        [StringLength(500)]
        public string Note { get; set; } = string.Empty;

        /// <summary>
        /// Money collection amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MoneyCollection { get; set; }

        /// <summary>
        /// Money fee COD amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MoneyFeeCod { get; set; }

        /// <summary>
        /// Total money amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MoneyTotal { get; set; }

        /// <summary>
        /// Expected delivery time
        /// </summary>
        [StringLength(250)]
        public string ExpectedDelivery { get; set; } = string.Empty;

        /// <summary>
        /// Product weight in grams
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProductWeight { get; set; }

        /// <summary>
        /// Order service code
        /// </summary>
        [StringLength(250)]
        public string OrderService { get; set; } = string.Empty;

        /// <summary>
        /// Token from ViettelPost
        /// </summary>
        [StringLength(250)]
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Whether webhook processing was successful
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Error message if processing failed
        /// </summary>
        [StringLength(1000)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Raw webhook data (JSON)
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? RawData { get; set; }

        /// <summary>
        /// Related order ID (if found)
        /// </summary>
        public int? OrderId { get; set; }

        /// <summary>
        /// Related shipping request ID (if found)
        /// </summary>
        public int? ShippingRequestId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }

        [ForeignKey("ShippingRequestId")]
        public virtual ShippingRequest? ShippingRequest { get; set; }
    }
}
