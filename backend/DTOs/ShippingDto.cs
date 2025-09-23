using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.DTOs
{
    /// <summary>
    /// Result of shipping fee calculation
    /// </summary>
    public class FeeResult
    {
        public bool IsSuccess { get; set; }
        public decimal Fee { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public int? EstimatedDeliveryDays { get; set; }
        public Dictionary<string, object> AdditionalData { get; set; } = new();
    }

    /// <summary>
    /// Result of creating a shipment
    /// </summary>
    public class CreateShipmentResult
    {
        public bool IsSuccess { get; set; }
        public string? TrackingCode { get; set; }
        public string? ExternalId { get; set; }
        public string? ErrorMessage { get; set; }
        public decimal? TotalFee { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public Dictionary<string, object> AdditionalData { get; set; } = new();
    }

    /// <summary>
    /// Result of cancelling a shipment
    /// </summary>
    public class CancelShipmentResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? CancelReason { get; set; }
        public decimal? RefundAmount { get; set; }
    }

    /// <summary>
    /// Result of tracking a shipment
    /// </summary>
    public class TrackingResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public ShippingStatus Status { get; set; }
        public string? StatusDescription { get; set; }
        public List<TrackingEvent> Events { get; set; } = new();
        public DateTime? EstimatedDeliveryDate { get; set; }
        public string? CurrentLocation { get; set; }
        public Dictionary<string, object> AdditionalData { get; set; } = new();
    }

    /// <summary>
    /// Individual tracking event
    /// </summary>
    public class TrackingEvent
    {
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
    }

    /// <summary>
    /// Request DTO for calculating shipping fee
    /// </summary>
    public class CalculateShippingFeeRequest
    {
        [Required]
        public ShippingProvider Provider { get; set; }

        [Required]
        public ShippingAddressDto FromAddress { get; set; } = new();

        [Required]
        public ShippingAddressDto ToAddress { get; set; } = new();

        [Range(1, 50000)]
        public int Weight { get; set; } = 500; // Default 500g

        public ShippingDimensionsDto? Dimensions { get; set; }

        [Range(0, double.MaxValue)]
        public decimal InsuranceValue { get; set; } = 0;

        [Range(0, double.MaxValue)]
        public decimal CodAmount { get; set; } = 0;

        public string? ServiceId { get; set; }
    }

    /// <summary>
    /// Request DTO for creating a shipment
    /// </summary>
    public class CreateShipmentRequest
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public ShippingProvider Provider { get; set; }

        public string? ServiceId { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }

        public bool RequireSignature { get; set; } = false;
    }

    /// <summary>
    /// Shipping address DTO
    /// </summary>
    public class ShippingAddressDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        [Phone]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string AddressDetail { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Ward { get; set; }

        [Required]
        [StringLength(100)]
        public string District { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Province { get; set; } = string.Empty;

        // For provider-specific IDs (e.g., Viettel Post)
        public int? ProvinceId { get; set; }
        public int? DistrictId { get; set; }
        public int? WardId { get; set; }
    }

    /// <summary>
    /// Package dimensions DTO
    /// </summary>
    public class ShippingDimensionsDto
    {
        [Range(1, 200)]
        public int Length { get; set; } // cm

        [Range(1, 200)]
        public int Width { get; set; } // cm

        [Range(1, 200)]
        public int Height { get; set; } // cm
    }

    /// <summary>
    /// Response DTO for shipping requests
    /// </summary>
    public class ShippingRequestResponseDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string? ServiceId { get; set; }
        public decimal Fee { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? TrackingCode { get; set; }
        public string? ExternalId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PickedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string? Note { get; set; }
    }

    /// <summary>
    /// Response DTO for tracking information
    /// </summary>
    public class TrackingResponseDto
    {
        public string TrackingCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string StatusDescription { get; set; } = string.Empty;
        public List<TrackingEventDto> Events { get; set; } = new();
        public DateTime? EstimatedDeliveryDate { get; set; }
        public string? CurrentLocation { get; set; }
    }

    /// <summary>
    /// Individual tracking event DTO
    /// </summary>
    public class TrackingEventDto
    {
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
    }

    /// <summary>
    /// Available shipping options response
    /// </summary>
    public class ShippingOptionsResponseDto
    {
        public List<ShippingOptionDto> Options { get; set; } = new();
    }

    /// <summary>
    /// Individual shipping option
    /// </summary>
    public class ShippingOptionDto
    {
        public ShippingProvider Provider { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public string? ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public decimal Fee { get; set; }
        public int? EstimatedDeliveryDays { get; set; }
        public bool IsAvailable { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Webhook payload from shipping providers
    /// </summary>
    public class ShippingWebhookDto
    {
        public string TrackingCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? Location { get; set; }
        public Dictionary<string, object> RawData { get; set; } = new();
    }

    /// <summary>
    /// Request to register inventory/warehouse with shipping provider
    /// </summary>
    public class RegisterInventoryRequest
    {
        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public int WardsId { get; set; }
    }

    /// <summary>
    /// Result of inventory registration
    /// </summary>
    public class RegisterInventoryResult
    {
        public bool IsSuccess { get; set; }
        public int? GroupAddressId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }
}
