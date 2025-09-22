using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Interface for shipping provider implementations
    /// </summary>
    public interface IShippingProvider
    {
        /// <summary>
        /// The shipping provider this implementation handles
        /// </summary>
        ShippingProvider Provider { get; }

        /// <summary>
        /// Check if this provider is enabled and configured
        /// </summary>
        Task<bool> IsAvailableAsync();

        /// <summary>
        /// Calculate shipping fee for an order
        /// </summary>
        /// <param name="request">Fee calculation request</param>
        /// <returns>Fee calculation result</returns>
        Task<FeeResult> CalculateFeeAsync(CalculateShippingFeeRequest request);

        /// <summary>
        /// Create a shipment with the provider
        /// </summary>
        /// <param name="order">Order to ship</param>
        /// <param name="shippingRequest">Shipping request details</param>
        /// <returns>Shipment creation result</returns>
        Task<CreateShipmentResult> CreateShipmentAsync(Order order, ShippingRequest shippingRequest);

        /// <summary>
        /// Cancel a shipment
        /// </summary>
        /// <param name="trackingCode">Tracking code of the shipment to cancel</param>
        /// <param name="reason">Cancellation reason</param>
        /// <returns>Cancellation result</returns>
        Task<CancelShipmentResult> CancelShipmentAsync(string trackingCode, string reason);

        /// <summary>
        /// Get tracking information for a shipment
        /// </summary>
        /// <param name="trackingCode">Tracking code</param>
        /// <returns>Tracking information</returns>
        Task<TrackingResult> GetTrackingAsync(string trackingCode);

        /// <summary>
        /// Process webhook data from the shipping provider
        /// </summary>
        /// <param name="webhookData">Raw webhook payload</param>
        /// <returns>Processed webhook information</returns>
        Task<ShippingWebhookDto?> ProcessWebhookAsync(string webhookData);

        /// <summary>
        /// Get available service types for this provider
        /// </summary>
        /// <returns>List of available services</returns>
        Task<List<ShippingServiceDto>> GetAvailableServicesAsync();

        /// <summary>
        /// Check if an address has any warnings (e.g., incorrect ward)
        /// </summary>
        /// <param name="wardId">Ward ID to check</param>
        /// <returns>Address warning result</returns>
        Task<AddressWarningResult> CheckAddressWarningAsync(int wardId);

        /// <summary>
        /// Get all available shipping options with fees for a given request
        /// </summary>
        /// <param name="request">Fee calculation request</param>
        /// <returns>List of shipping options with fees</returns>
        Task<List<ShippingOptionDto>> GetShippingOptionsAsync(CalculateShippingFeeRequest request);
    }

    /// <summary>
    /// Shipping service information
    /// </summary>
    public class ShippingServiceDto
    {
        public string ServiceId { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedDeliveryDays { get; set; }
        public bool IsAvailable { get; set; } = true;
    }

    /// <summary>
    /// Address warning check result
    /// </summary>
    public class AddressWarningResult
    {
        public bool HasWarning { get; set; }
        public string WarningMessage { get; set; } = string.Empty;
        public bool IsValid { get; set; }
    }
}
