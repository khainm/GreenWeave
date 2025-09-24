using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAllAsync();
        Task<Product?> GetByIdAsync(int id);
        Task<Product?> GetBySkuAsync(string sku);
        Task<Product> CreateAsync(Product product);
        Task<Product> UpdateAsync(Product product);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
        Task<bool> SkuExistsAsync(string sku, int? excludeId = null);

        // Extra granular operations to respect repository boundaries for customizable products
        Task AddImagesAsync(int productId, IEnumerable<ProductImage> images);
        Task ReplaceColorsAsync(int productId, IEnumerable<ProductColor> colors);
        Task UpsertColorImageAsync(int productId, string colorCode, ProductImage image);
        Task AddStickersAsync(int productId, IEnumerable<ProductSticker> stickers);
        Task ClearStickersAsync(int productId);
        Task ClearImagesAsync(int productId);

        // Queries for customizable products (categories with IsCustomizable = true)
        Task<IEnumerable<Product>> GetCustomizableAsync();
        Task<Product?> GetCustomizableByIdAsync(int id);
        
        // Search and filter products
        Task<(IEnumerable<Product> Products, int TotalCount)> SearchProductsAsync(
            string? search,
            string? category,
            string? status,
            decimal? minPrice,
            decimal? maxPrice,
            int? minStock,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize);
    }
}
