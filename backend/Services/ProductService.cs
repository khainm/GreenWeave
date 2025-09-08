using backend.DTOs;
using backend.Models;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ILogger<ProductService> _logger;
        
        // SKU prefix mapping
        private readonly Dictionary<string, string> _skuPrefixes = new()
        {
            { "Non-stop", "NON" },
            { "Trơn", "TRON" },
            { "Thêu", "THEU" }
        };
        
        public ProductService(
            IProductRepository productRepository,
            ICloudinaryService cloudinaryService,
            ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _cloudinaryService = cloudinaryService;
            _logger = logger;
        }
        
        public async Task<IEnumerable<ProductResponseDto>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllAsync();
            return products.Select(MapToResponseDto);
        }
        
        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            return product != null ? MapToResponseDto(product) : null;
        }
        
        public async Task<ProductResponseDto?> GetProductBySkuAsync(string sku)
        {
            var product = await _productRepository.GetBySkuAsync(sku);
            return product != null ? MapToResponseDto(product) : null;
        }
        
        public async Task<ProductResponseDto> CreateProductAsync(CreateProductDto createProductDto, List<IFormFile>? imageFiles = null)
        {
            try
            {
                // Validate SKU uniqueness
                if (await _productRepository.SkuExistsAsync(createProductDto.Sku))
                {
                    throw new InvalidOperationException($"SKU '{createProductDto.Sku}' already exists");
                }
                
                // Create product entity
                var product = new Product
                {
                    Name = createProductDto.Name,
                    Sku = createProductDto.Sku,
                    Category = createProductDto.Category,
                    Description = createProductDto.Description,
                    Price = createProductDto.Price,
                    OriginalPrice = createProductDto.OriginalPrice,
                    Stock = createProductDto.Stock,
                    Status = createProductDto.Status
                };
                
                // Process colors
                if (createProductDto.Colors.Any())
                {
                    product.Colors = createProductDto.Colors.Select((color, index) => new ProductColor
                    {
                        ColorCode = color,
                        ColorName = GetColorName(color),
                        SortOrder = index
                    }).ToList();
                }
                
                // Process images
                var images = new List<ProductImage>();
                
                // Upload files to Cloudinary
                if (imageFiles != null && imageFiles.Any())
                {
                    for (int i = 0; i < imageFiles.Count; i++)
                    {
                        var file = imageFiles[i];
                        if (file.Length > 0)
                        {
                            try
                            {
                                var uploadResult = await _cloudinaryService.UploadImageAsync(file, "products");
                                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                                {
                                    images.Add(new ProductImage
                                    {
                                        ImageUrl = uploadResult.SecureUrl.ToString(),
                                        CloudinaryPublicId = uploadResult.PublicId,
                                        SortOrder = i,
                                        IsPrimary = i == 0
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload image file {FileName}", file.FileName);
                            }
                        }
                    }
                }
                
                // Process image URLs
                if (createProductDto.ImageUrls != null && createProductDto.ImageUrls.Any())
                {
                    int startIndex = images.Count;
                    for (int i = 0; i < createProductDto.ImageUrls.Count; i++)
                    {
                        var imageUrl = createProductDto.ImageUrls[i];
                        if (!string.IsNullOrEmpty(imageUrl))
                        {
                            try
                            {
                                // Try to upload URL to Cloudinary for optimization
                                var uploadResult = await _cloudinaryService.UploadImageAsync(imageUrl, "products");
                                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                                {
                                    images.Add(new ProductImage
                                    {
                                        ImageUrl = uploadResult.SecureUrl.ToString(),
                                        CloudinaryPublicId = uploadResult.PublicId,
                                        SortOrder = startIndex + i,
                                        IsPrimary = images.Count == 0
                                    });
                                }
                                else
                                {
                                    // If Cloudinary upload fails, use original URL
                                    images.Add(new ProductImage
                                    {
                                        ImageUrl = imageUrl,
                                        SortOrder = startIndex + i,
                                        IsPrimary = images.Count == 0
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload image URL {ImageUrl}", imageUrl);
                                // Use original URL as fallback
                                images.Add(new ProductImage
                                {
                                    ImageUrl = imageUrl,
                                    SortOrder = startIndex + i,
                                    IsPrimary = images.Count == 0
                                });
                            }
                        }
                    }
                }
                
                product.Images = images;
                
                // Create product
                var createdProduct = await _productRepository.CreateAsync(product);
                
                _logger.LogInformation("Product created successfully: {ProductId} - {ProductName}", createdProduct.Id, createdProduct.Name);
                
                return MapToResponseDto(createdProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product: {ProductName}", createProductDto.Name);
                throw;
            }
        }
        
        public async Task<ProductResponseDto> UpdateProductAsync(int id, CreateProductDto updateProductDto, List<IFormFile>? imageFiles = null)
        {
            try
            {
                var existingProduct = await _productRepository.GetByIdAsync(id);
                if (existingProduct == null)
                {
                    throw new InvalidOperationException($"Product with ID {id} not found");
                }
                
                // Validate SKU uniqueness (excluding current product)
                if (await _productRepository.SkuExistsAsync(updateProductDto.Sku, id))
                {
                    throw new InvalidOperationException($"SKU '{updateProductDto.Sku}' already exists");
                }
                
                // Update basic properties
                existingProduct.Name = updateProductDto.Name;
                existingProduct.Sku = updateProductDto.Sku;
                existingProduct.Category = updateProductDto.Category;
                existingProduct.Description = updateProductDto.Description;
                existingProduct.Price = updateProductDto.Price;
                existingProduct.OriginalPrice = updateProductDto.OriginalPrice;
                existingProduct.Stock = updateProductDto.Stock;
                existingProduct.Status = updateProductDto.Status;
                
                // Update colors (replace all)
                existingProduct.Colors.Clear();
                if (updateProductDto.Colors.Any())
                {
                    existingProduct.Colors = updateProductDto.Colors.Select((color, index) => new ProductColor
                    {
                        ProductId = id,
                        ColorCode = color,
                        ColorName = GetColorName(color),
                        SortOrder = index
                    }).ToList();
                }
                
                // Handle new image uploads if provided
                if (imageFiles != null && imageFiles.Any())
                {
                    for (int i = 0; i < imageFiles.Count; i++)
                    {
                        var file = imageFiles[i];
                        if (file.Length > 0)
                        {
                            try
                            {
                                var uploadResult = await _cloudinaryService.UploadImageAsync(file, "products");
                                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                                {
                                    existingProduct.Images.Add(new ProductImage
                                    {
                                        ProductId = id,
                                        ImageUrl = uploadResult.SecureUrl.ToString(),
                                        CloudinaryPublicId = uploadResult.PublicId,
                                        SortOrder = existingProduct.Images.Count + i,
                                        IsPrimary = existingProduct.Images.Count == 0
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload image file {FileName} for product {ProductId}", file.FileName, id);
                            }
                        }
                    }
                }
                
                var updatedProduct = await _productRepository.UpdateAsync(existingProduct);
                
                _logger.LogInformation("Product updated successfully: {ProductId} - {ProductName}", updatedProduct.Id, updatedProduct.Name);
                
                return MapToResponseDto(updatedProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product with ID: {ProductId}", id);
                throw;
            }
        }
        
        public async Task<bool> DeleteProductAsync(int id)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);
                if (product == null)
                    return false;
                
                // Delete images from Cloudinary
                foreach (var image in product.Images.Where(i => !string.IsNullOrEmpty(i.CloudinaryPublicId)))
                {
                    try
                    {
                        await _cloudinaryService.DeleteImageAsync(image.CloudinaryPublicId!);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete image {PublicId} from Cloudinary", image.CloudinaryPublicId);
                    }
                }
                
                var result = await _productRepository.DeleteAsync(id);
                
                if (result)
                    _logger.LogInformation("Product deleted successfully: {ProductId}", id);
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product with ID: {ProductId}", id);
                throw;
            }
        }
        
        public async Task<string> GenerateSkuAsync(string category)
        {
            var prefix = _skuPrefixes.ContainsKey(category) ? _skuPrefixes[category] : "GW";
            
            string sku;
            bool exists;
            
            do
            {
                var random = new Random().Next(1000, 9999);
                sku = $"{prefix}{random}";
                exists = await _productRepository.SkuExistsAsync(sku);
            } while (exists);
            
            return sku;
        }
        
        private ProductResponseDto MapToResponseDto(Product product)
        {
            return new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                Sku = product.Sku,
                Category = product.Category,
                Description = product.Description,
                Price = product.Price,
                OriginalPrice = product.OriginalPrice,
                Stock = product.Stock,
                Status = product.Status,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                Images = product.Images.Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
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
            };
        }
        
        private string? GetColorName(string colorCode)
        {
            // Basic color name mapping - you can expand this
            var colorNames = new Dictionary<string, string>
            {
                { "#ffffff", "Trắng" },
                { "#000000", "Đen" },
                { "#ff0000", "Đỏ" },
                { "#00ff00", "Xanh lá" },
                { "#0000ff", "Xanh dương" },
                { "#ffff00", "Vàng" },
                { "#ff00ff", "Hồng" },
                { "#00ffff", "Xanh ngọc" },
                { "#808080", "Xám" },
                { "#8b4513", "Nâu" },
                { "#ffa500", "Cam" },
                { "#800080", "Tím" }
            };
            
            return colorNames.ContainsKey(colorCode.ToLower()) ? colorNames[colorCode.ToLower()] : null;
        }
    }
}
