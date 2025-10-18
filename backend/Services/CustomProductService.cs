using backend.DTOs;
using backend.Models;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Services;

namespace backend.Services
{
    /// <summary>
    /// Service for managing customizable products
    /// Handles business logic for products that support user customization
    /// </summary>
    public class CustomProductService : ICustomProductService
    {
        private readonly ICustomProductRepository _customProductRepository;
        private readonly IProductRepository _productRepository;
        private readonly ILogger<CustomProductService> _logger;
        
        public CustomProductService(
            ICustomProductRepository customProductRepository,
            IProductRepository productRepository,
            ILogger<CustomProductService> logger)
        {
            _customProductRepository = customProductRepository;
            _productRepository = productRepository;
            _logger = logger;
        }
        
        public async Task<IEnumerable<CustomProductResponseDto>> GetCustomizableProductsAsync()
        {
            try
            {
                var products = await _customProductRepository.GetCustomizableAsync();
                return products.Select(MapToCustomProductResponseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable products");
                throw;
            }
        }
        
        public async Task<CustomProductResponseDto?> GetCustomizableProductByIdAsync(int id)
        {
            try
            {
                var product = await _customProductRepository.GetCustomizableByIdAsync(id);
                return product != null ? MapToCustomProductResponseDto(product) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable product by id: {Id}", id);
                throw;
            }
        }
        
        public async Task<PaginatedResult<CustomProductResponseDto>> GetCustomizableProductsPaginatedAsync(
            int page = 1, 
            int pageSize = 20)
        {
            try
            {
                var totalItems = await _customProductRepository.GetCustomizableTotalCountAsync();
                var products = await _customProductRepository.GetCustomizableAsync(page, pageSize);
                var items = products.Select(MapToCustomProductResponseDto);

                return new PaginatedResult<CustomProductResponseDto>
                {
                    Items = items,
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling((double)totalItems / pageSize)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paginated customizable products");
                throw;
            }
        }
        
        public async Task<bool> IsProductCustomizableAsync(int productId)
        {
            try
            {
                return await _customProductRepository.IsProductCustomizableAsync(productId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if product is customizable: {ProductId}", productId);
                throw;
            }
        }
        
        // Removed: GetProductStickersAsync - Stickers moved to external Sticker Library
        
        public async Task<List<ProductColorDto>> GetProductColorsAsync(int productId)
        {
            try
            {
                var colors = await _customProductRepository.GetProductColorsAsync(productId);
                return colors.Select(c => new ProductColorDto
                {
                    Id = c.Id,
                    ColorCode = c.ColorCode,
                    ColorName = c.ColorName,
                    SortOrder = c.SortOrder
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting colors for product: {ProductId}", productId);
                throw;
            }
        }
        
        /// <summary>
        /// Maps Product entity to CustomProductResponseDto
        /// </summary>
        private static CustomProductResponseDto MapToCustomProductResponseDto(Product product)
        {
            return new CustomProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                Sku = product.Sku,
                Category = product.Category,
                Description = product.Description,
                Price = product.Price,
                OriginalPrice = product.OriginalPrice,
                Stock = product.Stock,
                Weight = product.Weight,
                Status = product.Status,
                PrimaryWarehouseId = product.PrimaryWarehouseId?.ToString(),
                PrimaryWarehouseName = product.PrimaryWarehouseName,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                Images = product.Images.Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    ColorCode = i.ColorCode,
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary
                }).ToList(),
                Colors = product.Colors.Select(c => new ProductColorDto
                {
                    Id = c.Id,
                    ColorCode = c.ColorCode,
                    ColorName = c.ColorName,
                    SortOrder = c.SortOrder
                }).ToList()
                // Removed: Stickers - use Sticker Library instead
            };
        }
    }
}
