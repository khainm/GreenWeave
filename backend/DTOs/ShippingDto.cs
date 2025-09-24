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
    /// Result of updating an order
    /// </summary>
    public class UpdateOrderResult
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }
        public string? ErrorMessage { get; set; }
        public Dictionary<string, object> AdditionalData { get; set; } = new();
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
    /// Request DTO for updating an order
    /// </summary>
    public class UpdateOrderRequest
    {
        [Required]
        public ShippingAddressDto FromAddress { get; set; } = new();

        [Required]
        public ShippingAddressDto ToAddress { get; set; } = new();

        [StringLength(500)]
        public string? Note { get; set; }

        public decimal CodAmount { get; set; }
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

    public class ListInventoryResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public List<InventoryData>? Inventories { get; set; }
    }

    public class InventoryData
    {
        public int GroupAddressId { get; set; }    // ✅ NUMBER - Store ID
        public int CusId { get; set; }              // ✅ NUMBER - Customer ID
        public string Name { get; set; } = string.Empty;     // ✅ VARCHAR2(250) - Customer name
        public string Phone { get; set; } = string.Empty;    // ✅ VARCHAR2(250) - Phone number
        public string Address { get; set; } = string.Empty;  // ✅ VARCHAR2(250) - Address
        public int ProvinceId { get; set; }        // ✅ NUMBER - Province/city status
        public int DistrictId { get; set; }         // ✅ NUMBER - District status
        public int WardsId { get; set; }            // ✅ NUMBER - Ward status
    }

    /// <summary>
    /// ViettelPost Webhook Data Structure
    /// </summary>
    public class ViettelPostWebhookData
    {
        public string ORDER_NUMBER { get; set; } = string.Empty;
        public string ORDER_REFERENCE { get; set; } = string.Empty;
        public string ORDER_STATUSDATE { get; set; } = string.Empty;
        public int ORDER_STATUS { get; set; }
        public string NOTE { get; set; } = string.Empty;
        public decimal MONEY_COLLECTION { get; set; }
        public decimal MONEY_FEECOD { get; set; }
        public decimal MONEY_TOTAL { get; set; }
        public string EXPECTED_DELIVERY { get; set; } = string.Empty;
        public decimal PRODUCT_WEIGHT { get; set; }
        public string ORDER_SERVICE { get; set; } = string.Empty;
        public string TOKEN { get; set; } = string.Empty;
    }

    /// <summary>
    /// Webhook processing result
    /// </summary>
    public class WebhookProcessingResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public string? OrderNumber { get; set; }
        public int? OrderStatus { get; set; }
        public string? StatusDescription { get; set; }
    }

    /// <summary>
    /// Webhook log DTO
    /// </summary>
    public class WebhookLogDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string OrderReference { get; set; } = string.Empty;
        public string OrderStatusDate { get; set; } = string.Empty;
        public int OrderStatus { get; set; }
        public string StatusDescription { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public decimal MoneyCollection { get; set; }
        public decimal MoneyFeeCod { get; set; }
        public decimal MoneyTotal { get; set; }
        public string ExpectedDelivery { get; set; } = string.Empty;
        public decimal ProductWeight { get; set; }
        public string OrderService { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? RawData { get; set; }
        public int? OrderId { get; set; }
        public int? ShippingRequestId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// Webhook log list result
    /// </summary>
    public class WebhookLogListResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<WebhookLogDto> WebhookLogs { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Webhook statistics DTO
    /// </summary>
    public class WebhookStatsDto
    {
        public int TotalWebhooks { get; set; }
        public int SuccessfulWebhooks { get; set; }
        public int FailedWebhooks { get; set; }
        public DateTime? LastWebhookTime { get; set; }
        public List<string> RecentOrderNumbers { get; set; } = new();
    }
}
