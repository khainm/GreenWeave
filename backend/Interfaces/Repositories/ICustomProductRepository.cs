using backend.Models;

namespace backend.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for customizable products data access
    /// Handles queries specific to products that support customization
    /// </summary>
    public interface ICustomProductRepository
    {
        /// <summary>
        /// Get all products from customizable categories (isCustomizable = true)
        /// </summary>
        Task<IEnumerable<Product>> GetCustomizableAsync();
        
        /// <summary>
        /// Get customizable products with pagination
        /// </summary>
        Task<IEnumerable<Product>> GetCustomizableAsync(int page, int pageSize);
        
        /// <summary>
        /// Get total count of customizable products
        /// </summary>
        Task<int> GetCustomizableTotalCountAsync();
        
        /// <summary>
        /// Get a specific customizable product by ID with full details
        /// </summary>
        Task<Product?> GetCustomizableByIdAsync(int id);
        
        /// <summary>
        /// Check if a product belongs to a customizable category
        /// </summary>
        Task<bool> IsProductCustomizableAsync(int productId);
        
        // Removed: GetProductStickersAsync - Stickers moved to external Sticker Library
        
        /// <summary>
        /// Get all colors available for a specific product
        /// </summary>
        Task<List<ProductColor>> GetProductColorsAsync(int productId);
    }
}
