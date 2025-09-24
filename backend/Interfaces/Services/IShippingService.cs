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
    }
}
