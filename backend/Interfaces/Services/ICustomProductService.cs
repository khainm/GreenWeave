using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Service interface for managing custom/customizable products
    /// Separated from regular product operations for better maintainability
    /// </summary>
    public interface ICustomProductService
    {
        /// <summary>
        /// Get all products that can be customized (belong to isCustomizable categories)
        /// </summary>
        Task<IEnumerable<CustomProductResponseDto>> GetCustomizableProductsAsync();
        
        /// <summary>
        /// Get a specific customizable product by ID with full details
        /// </summary>
        Task<CustomProductResponseDto?> GetCustomizableProductByIdAsync(int id);
        
        /// <summary>
        /// Get customizable products with pagination
        /// </summary>
        Task<PaginatedResult<CustomProductResponseDto>> GetCustomizableProductsPaginatedAsync(int page = 1, int pageSize = 20);
        
        /// <summary>
        /// Check if a product is customizable
        /// </summary>
        Task<bool> IsProductCustomizableAsync(int productId);
        
        // Removed: GetProductStickersAsync - Stickers moved to external Sticker Library
        
        /// <summary>
        /// Get available colors for a customizable product
        /// </summary>
        Task<List<ProductColorDto>> GetProductColorsAsync(int productId);
    }
}
