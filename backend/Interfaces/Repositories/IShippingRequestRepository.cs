using backend.Models;

namespace backend.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for shipping requests
    /// </summary>
    public interface IShippingRequestRepository
    {
        /// <summary>
        /// Get shipping request by ID
        /// </summary>
        /// <param name="id">Shipping request ID</param>
        /// <returns>Shipping request or null</returns>
        Task<ShippingRequest?> GetByIdAsync(int id);

        /// <summary>
        /// Get shipping request by order ID
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>Shipping request or null</returns>
        Task<ShippingRequest?> GetByOrderIdAsync(int orderId);

        /// <summary>
        /// Get shipping request by tracking code
        /// </summary>
        /// <param name="trackingCode">Tracking code</param>
        /// <returns>Shipping request or null</returns>
        Task<ShippingRequest?> GetByTrackingCodeAsync(string trackingCode);

        /// <summary>
        /// Get all shipping requests with optional filtering
        /// </summary>
        /// <param name="provider">Optional provider filter</param>
        /// <param name="status">Optional status filter</param>
        /// <param name="dateFrom">Optional date from filter</param>
        /// <param name="dateTo">Optional date to filter</param>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>Tuple of shipping requests and total count</returns>
        Task<(IEnumerable<ShippingRequest> requests, int total)> GetFilteredAsync(
            ShippingProvider? provider = null,
            ShippingStatus? status = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// Create a new shipping request
        /// </summary>
        /// <param name="shippingRequest">Shipping request to create</param>
        /// <returns>Created shipping request</returns>
        Task<ShippingRequest> CreateAsync(ShippingRequest shippingRequest);

        /// <summary>
        /// Update an existing shipping request
        /// </summary>
        /// <param name="shippingRequest">Shipping request to update</param>
        /// <returns>Updated shipping request</returns>
        Task<ShippingRequest> UpdateAsync(ShippingRequest shippingRequest);

        /// <summary>
        /// Delete a shipping request
        /// </summary>
        /// <param name="id">Shipping request ID</param>
        /// <returns>True if deleted successfully</returns>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Get shipping requests by provider
        /// </summary>
        /// <param name="provider">Shipping provider</param>
        /// <returns>List of shipping requests</returns>
        Task<IEnumerable<ShippingRequest>> GetByProviderAsync(ShippingProvider provider);

        /// <summary>
        /// Get shipping requests by status
        /// </summary>
        /// <param name="status">Shipping status</param>
        /// <returns>List of shipping requests</returns>
        Task<IEnumerable<ShippingRequest>> GetByStatusAsync(ShippingStatus status);

        /// <summary>
        /// Get pending shipping requests (for processing)
        /// </summary>
        /// <returns>List of pending shipping requests</returns>
        Task<IEnumerable<ShippingRequest>> GetPendingAsync();
    }
}
