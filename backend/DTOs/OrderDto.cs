using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.DTOs
{
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public CustomerInfoDto Customer { get; set; } = new();
        public UserAddressDto ShippingAddress { get; set; } = new();
        public List<OrderItemResponseDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancelReason { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        
        // Shipping fields
        public string ShippingProvider { get; set; } = string.Empty;
        public string? ShippingCode { get; set; }
        public string ShippingStatus { get; set; } = string.Empty;
        public List<ShippingHistoryEvent>? ShippingHistory { get; set; }
    }

    /// <summary>
    /// Shipping history event for display
    /// </summary>
    public class ShippingHistoryEvent
    {
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
    }

    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public object? Customization { get; set; }
    }

    public class CustomerInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class CreateOrderDto
    {
        [Required]
        public string CustomerId { get; set; } = string.Empty;

        [Required]
        public Guid ShippingAddressId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Đơn hàng phải có ít nhất 1 sản phẩm")]
        public List<CreateOrderItemDto> Items { get; set; } = new();

        public decimal ShippingFee { get; set; } = 0;
        public decimal Discount { get; set; } = 0;

        [MaxLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// Shipping provider for this order
        /// </summary>
        public ShippingProvider ShippingProvider { get; set; } = ShippingProvider.ViettelPost;

        /// <summary>
        /// Service ID for the selected shipping provider (e.g., "VCN" for Viettel Post)
        /// </summary>
        [StringLength(50)]
        public string? ShippingServiceId { get; set; }

        /// <summary>
        /// Payment method for this order
        /// </summary>
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá phải lớn hơn hoặc bằng 0")]
        public decimal UnitPrice { get; set; }

        public object? Customization { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class OrderFilterDto
    {
        public OrderStatus? Status { get; set; }
        public string? Search { get; set; } // Tìm theo order number, customer name, email
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string? CustomerId { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class OrderListResponseDto
    {
        public List<OrderResponseDto> Orders { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class OrderStatsDto
    {
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int ProcessingOrders { get; set; }
        public int ShippingOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public int CancelledOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TodayOrders { get; set; }
    }

    public class RejectOrderRequest
    {
        [Required]
        [StringLength(500, ErrorMessage = "Lý do từ chối không được vượt quá 500 ký tự")]
        public string Reason { get; set; } = string.Empty;
    }
}