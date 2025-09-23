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
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly IProductWarehouseStockRepository _productWarehouseStockRepository;
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
            IWarehouseRepository warehouseRepository,
            IProductWarehouseStockRepository productWarehouseStockRepository,
            ICloudinaryService cloudinaryService,
            ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _warehouseRepository = warehouseRepository;
            _productWarehouseStockRepository = productWarehouseStockRepository;
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

        public async Task<IEnumerable<ProductResponseDto>> GetCustomizableProductsAsync()
        {
            var products = await _productRepository.GetCustomizableAsync();
            return products.Select(MapToResponseDto);
        }

        public async Task<ProductResponseDto?> GetCustomizableProductByIdAsync(int id)
        {
            var product = await _productRepository.GetCustomizableByIdAsync(id);
            return product != null ? MapToResponseDto(product) : null;
        }
        
        public async Task<ProductResponseDto> CreateProductAsync(CreateProductDto createProductDto, List<IFormFile>? imageFiles = null, Dictionary<string, IFormFile>? colorImages = null, List<IFormFile>? stickerFiles = null)
        {
            try
            {
                // Validate SKU uniqueness
                if (await _productRepository.SkuExistsAsync(createProductDto.Sku))
                {
                    throw new InvalidOperationException($"SKU '{createProductDto.Sku}' already exists");
                }
                
                // Get primary warehouse info if provided
                string? primaryWarehouseName = null;
                if (createProductDto.PrimaryWarehouseId.HasValue)
                {
                    var warehouse = await _warehouseRepository.GetByIdAsync(createProductDto.PrimaryWarehouseId.Value);
                    primaryWarehouseName = warehouse?.Name;
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
                    Stock = createProductDto.Stock, // Tổng stock sẽ được tính từ warehouse stocks
                    Weight = createProductDto.Weight,
                    Status = createProductDto.Status,
                    PrimaryWarehouseId = createProductDto.PrimaryWarehouseId,
                    PrimaryWarehouseName = primaryWarehouseName
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
                                        ColorCode = null, // nếu cần mapping theo màu, client có thể encode vào tên file hoặc gửi map riêng
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
                                        ColorCode = null,
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
                                        ColorCode = null,
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
                                    ColorCode = null,
                                    SortOrder = startIndex + i,
                                    IsPrimary = images.Count == 0
                                });
                            }
                        }
                    }
                }
                
                // If client provided an explicit color->image mapping via URLs
                if (createProductDto.ColorImageMap != null && createProductDto.ColorImageMap.Any())
                {
                    foreach (var kv in createProductDto.ColorImageMap)
                    {
                        var color = kv.Key;
                        var url = kv.Value;
                        if (string.IsNullOrWhiteSpace(url)) continue;
                        try
                        {
                            var uploadResult = await _cloudinaryService.UploadImageAsync(url, "products");
                            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                            {
                                images.Add(new ProductImage
                                {
                                    ImageUrl = uploadResult.SecureUrl.ToString(),
                                    CloudinaryPublicId = uploadResult.PublicId,
                                    ColorCode = color.ToLower(),
                                    SortOrder = images.Count,
                                    IsPrimary = images.Count == 0
                                });
                            }
                            else
                            {
                                images.Add(new ProductImage
                                {
                                    ImageUrl = url,
                                    ColorCode = color.ToLower(),
                                    SortOrder = images.Count,
                                    IsPrimary = images.Count == 0
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process color image map url {Url}", url);
                            images.Add(new ProductImage
                            {
                                ImageUrl = url,
                                ColorCode = color.ToLower(),
                                SortOrder = images.Count,
                                IsPrimary = images.Count == 0
                            });
                        }
                    }
                }

                // If client provided colorImages files directly in form-data
                if (colorImages != null && colorImages.Any())
                {
                    foreach (var kv in colorImages)
                    {
                        var code = kv.Key?.Trim();
                        var file = kv.Value;
                        if (string.IsNullOrWhiteSpace(code) || file == null || file.Length == 0) continue;
                        try
                        {
                            var uploadResult = await _cloudinaryService.UploadImageAsync(file, "products");
                            if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                            {
                                images.Add(new ProductImage
                                {
                                    ImageUrl = uploadResult.SecureUrl.ToString(),
                                    CloudinaryPublicId = uploadResult.PublicId,
                                    ColorCode = code.ToLower(),
                                    SortOrder = images.Count,
                                    IsPrimary = images.Count == 0
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to upload color image file for color {Color}", code);
                        }
                    }
                }

                product.Images = images;

                // Stickers collection to persist
                var stickers = new List<ProductSticker>();

                // Stickers from uploaded files (admin upload via form-data)
                if (stickerFiles != null && stickerFiles.Any())
                {
                    int order = 0;
                    foreach (var file in stickerFiles)
                    {
                        if (file == null || file.Length == 0) continue;
                        try
                        {
                            var upload = await _cloudinaryService.UploadImageAsync(file, "product-stickers");
                            if (upload.StatusCode == System.Net.HttpStatusCode.OK)
                            {
                                stickers.Add(new ProductSticker
                                {
                                    ImageUrl = upload.SecureUrl.ToString(),
                                    CloudinaryPublicId = upload.PublicId,
                                    SortOrder = order++
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to upload sticker file {FileName}", file.FileName);
                        }
                    }
                }

                // Stickers from URLs (optional)
                if (createProductDto.StickerUrls != null && createProductDto.StickerUrls.Any())
                {
                    int order = 0;
                    foreach (var url in createProductDto.StickerUrls)
                    {
                        if (string.IsNullOrWhiteSpace(url)) continue;
                        try
                        {
                            var upload = await _cloudinaryService.UploadImageAsync(url, "product-stickers");
                            if (upload.StatusCode == System.Net.HttpStatusCode.OK)
                            {
                                stickers.Add(new ProductSticker
                                {
                                    ImageUrl = upload.SecureUrl.ToString(),
                                    CloudinaryPublicId = upload.PublicId,
                                    SortOrder = order++
                                });
                            }
                            else
                            {
                                stickers.Add(new ProductSticker { ImageUrl = url, SortOrder = order++ });
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to upload sticker url {Url}", url);
                            stickers.Add(new ProductSticker { ImageUrl = url, SortOrder = order++ });
                        }
                    }
                }
                
                // Create product
                var createdProduct = await _productRepository.CreateAsync(product);

                // Persist stickers (if any)
                if (stickers.Any())
                {
                    foreach (var s in stickers) s.ProductId = createdProduct.Id;
                    await _productRepository.AddStickersAsync(createdProduct.Id, stickers);
                }

                // Create warehouse stock if primary warehouse is specified
                if (createProductDto.PrimaryWarehouseId.HasValue && createProductDto.Stock > 0)
                {
                    var warehouseStock = new ProductWarehouseStock
                    {
                        ProductId = createdProduct.Id,
                        WarehouseId = createProductDto.PrimaryWarehouseId.Value,
                        Stock = createProductDto.Stock,
                        ReservedStock = 0
                    };
                    await _productWarehouseStockRepository.CreateAsync(warehouseStock);
                    
                    // Update total stock in product
                    createdProduct.Stock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(createdProduct.Id);
                    await _productRepository.UpdateAsync(createdProduct);
                }
                
                _logger.LogInformation("Product created successfully: {ProductId} - {ProductName}", createdProduct.Id, createdProduct.Name);
                
                return MapToResponseDto(createdProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product: {ProductName}", createProductDto.Name);
                throw;
            }
        }
        
        public async Task<ProductResponseDto> UpdateProductAsync(int id, CreateProductDto updateProductDto, List<IFormFile>? imageFiles = null, List<IFormFile>? stickerFiles = null)
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
                
                // Get primary warehouse info if provided
                string? primaryWarehouseName = null;
                if (updateProductDto.PrimaryWarehouseId.HasValue)
                {
                    var warehouse = await _warehouseRepository.GetByIdAsync(updateProductDto.PrimaryWarehouseId.Value);
                    primaryWarehouseName = warehouse?.Name;
                }

                // Update basic properties
                existingProduct.Name = updateProductDto.Name;
                existingProduct.Sku = updateProductDto.Sku;
                existingProduct.Category = updateProductDto.Category;
                existingProduct.Description = updateProductDto.Description;
                existingProduct.Price = updateProductDto.Price;
                existingProduct.OriginalPrice = updateProductDto.OriginalPrice;
                existingProduct.Stock = updateProductDto.Stock;
                existingProduct.Weight = updateProductDto.Weight;
                existingProduct.Status = updateProductDto.Status;
                existingProduct.PrimaryWarehouseId = updateProductDto.PrimaryWarehouseId;
                existingProduct.PrimaryWarehouseName = primaryWarehouseName;
                
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
                
                // Handle image updates - imageFiles != null means user wants to change images
                if (imageFiles != null)
                {
                    // Clear existing images first
                    await _productRepository.ClearImagesAsync(id);
                    
                    // Clear the in-memory collection to avoid conflicts
                    existingProduct.Images.Clear();
                    
                    // Add new images if any
                    if (imageFiles.Any())
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
                                            SortOrder = i,
                                            IsPrimary = i == 0
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
                    // If imageFiles is empty, images are cleared but no new ones added
                }
                
                // Handle stickers update (replace all existing stickers)
                if ((stickerFiles != null && stickerFiles.Any()) || (updateProductDto.StickerUrls != null && updateProductDto.StickerUrls.Any()) || (updateProductDto.Stickers != null && updateProductDto.Stickers.Any()))
                {
                    // Clear existing stickers
                    await _productRepository.ClearStickersAsync(id);
                    
                    // Add new stickers from files
                    var stickers = new List<ProductSticker>();
                    int order = 0;
                    
                    if (stickerFiles != null && stickerFiles.Any())
                    {
                        foreach (var file in stickerFiles)
                        {
                            if (file == null || file.Length == 0) continue;
                            try
                            {
                                var upload = await _cloudinaryService.UploadImageAsync(file, "product-stickers");
                                if (upload.StatusCode == System.Net.HttpStatusCode.OK)
                                {
                                    stickers.Add(new ProductSticker
                                    {
                                        ProductId = id,
                                        ImageUrl = upload.SecureUrl.ToString(),
                                        CloudinaryPublicId = upload.PublicId,
                                        SortOrder = order++
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload sticker file {FileName} for product {ProductId}", file.FileName, id);
                            }
                        }
                    }
                    
                    // Add new stickers from URLs
                    if (updateProductDto.StickerUrls != null && updateProductDto.StickerUrls.Any())
                    {
                        foreach (var url in updateProductDto.StickerUrls)
                        {
                            if (string.IsNullOrWhiteSpace(url)) continue;
                            try
                            {
                                var upload = await _cloudinaryService.UploadImageAsync(url, "product-stickers");
                                if (upload.StatusCode == System.Net.HttpStatusCode.OK)
                                {
                                    stickers.Add(new ProductSticker
                                    {
                                        ProductId = id,
                                        ImageUrl = upload.SecureUrl.ToString(),
                                        CloudinaryPublicId = upload.PublicId,
                                        SortOrder = order++
                                    });
                                }
                                else
                                {
                                    stickers.Add(new ProductSticker 
                                    { 
                                        ProductId = id,
                                        ImageUrl = url, 
                                        SortOrder = order++ 
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload sticker url {Url} for product {ProductId}", url, id);
                                stickers.Add(new ProductSticker 
                                { 
                                    ProductId = id,
                                    ImageUrl = url, 
                                    SortOrder = order++ 
                                });
                            }
                        }
                    }
                    
                    // Add stickers from placedStickers (from frontend)
                    if (updateProductDto.Stickers != null && updateProductDto.Stickers.Any())
                    {
                        foreach (var sticker in updateProductDto.Stickers)
                        {
                            if (string.IsNullOrWhiteSpace(sticker.ImageUrl)) continue;
                            
                            // Skip placeholder stickers
                            if (sticker.ImageUrl == "custom-placeholder") continue;
                            
                            try
                            {
                                // If it's a URL, try to upload to Cloudinary
                                if (sticker.ImageUrl.StartsWith("http"))
                                {
                                    var upload = await _cloudinaryService.UploadImageAsync(sticker.ImageUrl, "product-stickers");
                                    if (upload.StatusCode == System.Net.HttpStatusCode.OK)
                                    {
                                        stickers.Add(new ProductSticker
                                        {
                                            ProductId = id,
                                            ImageUrl = upload.SecureUrl.ToString(),
                                            CloudinaryPublicId = upload.PublicId,
                                            SortOrder = sticker.SortOrder
                                        });
                                    }
                                    else
                                    {
                                        stickers.Add(new ProductSticker 
                                        { 
                                            ProductId = id,
                                            ImageUrl = sticker.ImageUrl, 
                                            SortOrder = sticker.SortOrder 
                                        });
                                    }
                                }
                                else
                                {
                                    // Direct URL or base64
                                    stickers.Add(new ProductSticker 
                                    { 
                                        ProductId = id,
                                        ImageUrl = sticker.ImageUrl, 
                                        SortOrder = sticker.SortOrder 
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to process sticker {ImageUrl} for product {ProductId}", sticker.ImageUrl, id);
                                stickers.Add(new ProductSticker 
                                { 
                                    ProductId = id,
                                    ImageUrl = sticker.ImageUrl, 
                                    SortOrder = sticker.SortOrder 
                                });
                            }
                        }
                    }
                    
                    // Persist new stickers
                    if (stickers.Any())
                    {
                        await _productRepository.AddStickersAsync(id, stickers);
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
                    SortOrder = i.SortOrder,
                    IsPrimary = i.IsPrimary,
                    ColorCode = i.ColorCode
                }).ToList(),
                Colors = product.Colors.Select(c => new ProductColorDto
                {
                    Id = c.Id,
                    ColorCode = c.ColorCode,
                    ColorName = c.ColorName,
                    SortOrder = c.SortOrder
                }).ToList(),
                Stickers = product.Stickers.Select(s => new ProductStickerDto
                {
                    Id = s.Id,
                    ImageUrl = s.ImageUrl,
                    SortOrder = s.SortOrder
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
