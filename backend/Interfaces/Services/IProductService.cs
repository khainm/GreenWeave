using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync();
        Task<ProductResponseDto?> GetProductByIdAsync(int id);
        Task<ProductResponseDto?> GetProductBySkuAsync(string sku);
        Task<ProductResponseDto> CreateProductAsync(CreateProductDto createProductDto, List<IFormFile>? imageFiles = null);
        Task<ProductResponseDto> UpdateProductAsync(int id, CreateProductDto updateProductDto, List<IFormFile>? imageFiles = null);
        Task<bool> DeleteProductAsync(int id);
        Task<string> GenerateSkuAsync(string category);
    }
}
