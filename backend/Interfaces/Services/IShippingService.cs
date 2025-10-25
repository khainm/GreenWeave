using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Service interface for shipping operations orchestration
    /// </summary>
    public interface IShippingService
    {
        /// <summary>
        /// Get all available shipping options for an order
        /// </summary>
        /// <param name="request">Fee calculation request</param>
        /// <returns>Available shipping options with fees</returns>
        Task<ShippingOptionsResponseDto> GetShippingOptionsAsync(CalculateShippingFeeRequest request);

        /// <summary>
        /// ✅ NEW: Get e-commerce shipping options (warehouse → customer)
        /// </summary>
        /// <param name="request">E-commerce shipping fee calculation request</param>
        /// <returns>Available shipping options with fees</returns>
        Task<ShippingOptionsResponseDto> GetEcommerceShippingOptionsAsync(CalculateEcommerceShippingFeeRequest request);

        /// <summary>
        /// Calculate shipping fee for a specific provider
        /// </summary>
        /// <param name="request">Fee calculation request</param>
        /// <returns>Fee calculation result</returns>
        Task<FeeResult> CalculateShippingFeeAsync(CalculateShippingFeeRequest request);

        /// <summary>
        /// Create a shipment for an order
        /// </summary>
        /// <param name="request">Shipment creation request</param>
        /// <returns>Shipment creation result</returns>
        Task<CreateShipmentResult> CreateShipmentAsync(CreateShipmentRequest request);

        /// <summary>
        /// Update an existing order
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <param name="request">Order update request</param>
        /// <returns>Order update result</returns>
        Task<UpdateOrderResult> UpdateOrderAsync(int orderId, UpdateOrderRequest request);

        /// <summary>
        /// Update order status (approve, cancel, return, delete)
        /// Uses /v2/order/UpdateOrder API for ViettelPost
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <param name="updateType">Update type: 1=Approve, 2=Approve Return, 3=Re-deliver, 4=Cancel, 11=Delete</param>
        /// <param name="note">Update note/reason (max 150 chars)</param>
        /// <returns>Status update result</returns>
        Task<UpdateOrderResult> UpdateOrderStatusAsync(int orderId, int updateType, string note);

        /// <summary>
        /// Get printing code for ViettelPost orders
        /// </summary>
        /// <param name="orderIds">Array of order IDs to print (max 100)</param>
        /// <param name="expiryTime">Link expiry time in epoch milliseconds</param>
        /// <returns>Printing code result</returns>
        Task<PrintingCodeResult> GetPrintingCodeAsync(int[] orderIds, long expiryTime);

        /// <summary>
        /// Cancel a shipment
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <param name="reason">Cancellation reason</param>
        /// <returns>Cancellation result</returns>
        Task<CancelShipmentResult> CancelShipmentAsync(int orderId, string reason);

        /// <summary>
        /// Get tracking information for an order
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>Tracking information</returns>
        Task<TrackingResponseDto?> GetTrackingAsync(int orderId);

        /// <summary>
        /// Update shipping status from webhook
        /// </summary>
        /// <param name="provider">Shipping provider</param>
        /// <param name="webhookData">Webhook payload</param>
        /// <returns>Success status</returns>
        Task<bool> ProcessWebhookAsync(ShippingProvider provider, string webhookData);

        /// <summary>
        /// Get shipping request details
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>Shipping request information</returns>
        Task<ShippingRequestResponseDto?> GetShippingRequestAsync(int orderId);

        /// <summary>
        /// List inventory from Viettel Post
        /// </summary>
        /// <returns>Inventory list result</returns>
        Task<ListInventoryResult> ListInventoryAsync();

        /// <summary>
        /// Register inventory/warehouse with shipping provider
        /// </summary>
        /// <param name="request">Inventory registration request</param>
        /// <returns>Registration result</returns>
        Task<RegisterInventoryResult> RegisterInventoryAsync(RegisterInventoryRequest request);
    }
}
