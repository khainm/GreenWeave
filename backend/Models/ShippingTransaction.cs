using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Represents a transaction log for shipping provider API calls
    /// </summary>
    public class ShippingTransaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShippingRequestId { get; set; }

        /// <summary>
        /// Type of operation (CalculateFee, CreateShipment, Track, Cancel, etc.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Operation { get; set; } = string.Empty;

        /// <summary>
        /// HTTP method used (GET, POST, PUT, DELETE)
        /// </summary>
        [StringLength(10)]
        public string? HttpMethod { get; set; }

        /// <summary>
        /// API endpoint URL
        /// </summary>
        [StringLength(500)]
        public string? Endpoint { get; set; }

        /// <summary>
        /// Request payload sent to shipping provider (JSON)
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? RequestData { get; set; }

        /// <summary>
        /// Response received from shipping provider (JSON)
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? ResponseData { get; set; }

        /// <summary>
        /// HTTP status code from the response
        /// </summary>
        public int? StatusCode { get; set; }

        /// <summary>
        /// Whether the operation was successful
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Error message if operation failed
        /// </summary>
        [StringLength(1000)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Response time in milliseconds
        /// </summary>
        public int? ResponseTimeMs { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ShippingRequestId")]
        public virtual ShippingRequest ShippingRequest { get; set; } = null!;
    }
}
