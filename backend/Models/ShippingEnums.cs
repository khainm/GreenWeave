namespace backend.Models
{
    /// <summary>
    /// Enum representing different shipping providers
    /// </summary>
    public enum ShippingProvider
    {
        /// <summary>
        /// Viettel Post shipping service
        /// </summary>
        ViettelPost = 1
    }

    /// <summary>
    /// Enum representing shipping status throughout the delivery process
    /// </summary>
    public enum ShippingStatus
    {
        /// <summary>
        /// Order created but not yet picked up by shipping provider
        /// </summary>
        PendingPickup = 1,
        
        /// <summary>
        /// Package has been picked up and is being prepared for shipment
        /// </summary>
        Picked = 2,
        
        /// <summary>
        /// Package is in transit to destination
        /// </summary>
        InTransit = 3,
        
        /// <summary>
        /// Package is out for delivery
        /// </summary>
        OutForDelivery = 4,
        
        /// <summary>
        /// Package has been successfully delivered
        /// </summary>
        Delivered = 5,
        
        /// <summary>
        /// Delivery attempt failed (will retry)
        /// </summary>
        Failed = 6,
        
        /// <summary>
        /// Package is being returned to sender
        /// </summary>
        Returning = 7,
        
        /// <summary>
        /// Package has been returned to sender
        /// </summary>
        Returned = 8,
        
        /// <summary>
        /// Shipment has been cancelled
        /// </summary>
        Cancelled = 9
    }
}
