using backend.DTOs;
using backend.Models;
using backend.Services;

namespace backend.Interfaces.Services
{
    public interface IProductService
    {
        Task<PaginatedResult<ProductResponseDto>> GetAllProductsAsync(int page = 1, int pageSize = 20);
        Task<ProductResponseDto?> GetProductByIdAsync(int id);
        Task<ProductResponseDto?> GetProductBySkuAsync(string sku);
        Task<ProductResponseDto> CreateProductAsync(CreateProductDto createProductDto, List<IFormFile>? imageFiles = null, Dictionary<string, IFormFile>? colorImages = null, List<IFormFile>? stickerFiles = null);
        Task<ProductResponseDto> UpdateProductAsync(int id, CreateProductDto updateProductDto, List<IFormFile>? imageFiles = null, List<IFormFile>? stickerFiles = null);
        Task<bool> DeleteProductAsync(int id);
        Task<string> GenerateSkuAsync(string category);

        // Queries for customizable products
        Task<IEnumerable<ProductResponseDto>> GetCustomizableProductsAsync();
        Task<ProductResponseDto?> GetCustomizableProductByIdAsync(int id);
        
        // Search and filter products
        Task<ProductSearchResponse> SearchProductsAsync(ProductSearchRequest request);
    }
}
