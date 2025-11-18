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
        
        public async Task<PaginatedResult<ProductResponseDto>> GetAllProductsAsync(int page = 1, int pageSize = 20)
        {
            var totalItems = await _productRepository.GetTotalCountAsync();
            var products = await _productRepository.GetAllAsync(page, pageSize);
            var items = products.Select(MapToResponseDto);

            return new PaginatedResult<ProductResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling((double)totalItems / pageSize)
            };
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
                // Logic: 
                // - Nếu imageColorMode = "per-color": Ảnh đầu tiên = ảnh chính, các ảnh tiếp theo map với màu theo thứ tự
                // - Nếu imageColorMode = "shared": Tất cả ảnh là ảnh chung (góc nhìn khác nhau), không map với màu cụ thể
                if (imageFiles != null && imageFiles.Any())
                {
                    var colorsList = createProductDto.Colors ?? new List<string>();
                    var imageColorMode = createProductDto.ImageColorMode ?? "shared"; // Mặc định: ảnh chung
                    
                    _logger.LogInformation(
                        "🎨 Image upload started: Mode={Mode}, {ImageCount} images, {ColorCount} colors", 
                        imageColorMode,
                        imageFiles.Count, 
                        colorsList.Count
                    );
                    
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
                                    string? colorCode = null;
                                    
                                    // CHỈ MAP MÀU NẾU MODE = "per-color"
                                    if (imageColorMode == "per-color" && i > 0 && colorsList.Count > 0)
                                    {
                                        // Map ảnh thứ i với màu thứ (i-1)
                                        // Ví dụ: ảnh 1 → màu 0, ảnh 2 → màu 1, ...
                                        int colorIndex = i - 1;
                                        if (colorIndex < colorsList.Count)
                                        {
                                            colorCode = colorsList[colorIndex].ToLower();
                                        }
                                    }
                                    // Nếu mode = "shared", colorCode = null cho TẤT CẢ ảnh (ảnh chung cho tất cả màu)
                                    
                                    images.Add(new ProductImage
                                    {
                                        ImageUrl = uploadResult.SecureUrl.ToString(),
                                        CloudinaryPublicId = uploadResult.PublicId,
                                        ColorCode = colorCode,
                                        SortOrder = i,
                                        IsPrimary = i == 0
                                    });
                                    
                                    _logger.LogInformation(
                                        "📸 Uploaded image {Index}: Mode={Mode}, Type={Type}, ColorCode={ColorCode}", 
                                        i,
                                        imageColorMode,
                                        i == 0 ? "PRIMARY" : (colorCode != null ? "COLOR_MAPPED" : "SHARED"),
                                        colorCode ?? "none"
                                    );
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

                // Stickers removed - use external Sticker Library instead
                
            // Create product
            var createdProduct = await _productRepository.CreateAsync(product);

            // Create warehouse stock if primary warehouse is specified (only for regular products)
            if (createProductDto.PrimaryWarehouseId.HasValue && createProductDto.Stock.HasValue && createProductDto.Stock.Value > 0)
            {
                var warehouseStock = new ProductWarehouseStock
                {
                    ProductId = createdProduct.Id,
                    WarehouseId = createProductDto.PrimaryWarehouseId.Value,
                    Stock = createProductDto.Stock.Value, // Convert nullable int to int
                    ReservedStock = 0
                };
                await _productWarehouseStockRepository.CreateAsync(warehouseStock);                    // Update total stock in product
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
                
                // Handle image updates - SMART MERGE: reuse existing images, only upload new ones
                var colorsList = updateProductDto.Colors ?? new List<string>();
                var keptImageUrls = updateProductDto.ImageUrls ?? new List<string>();
                
                _logger.LogInformation(
                    "🔄 UPDATE - Smart merge: {KeptCount} kept + {NewCount} new = {TotalCount} total, Colors: {ColorCount}", 
                    keptImageUrls.Count,
                    imageFiles?.Count ?? 0,
                    keptImageUrls.Count + (imageFiles?.Count ?? 0),
                    colorsList.Count
                );
                
                // Step 1: Xóa những ảnh KHÔNG CÒN trong danh sách (không trong imageUrls)
                var imagesToDelete = existingProduct.Images
                    .Where(img => !keptImageUrls.Contains(img.ImageUrl))
                    .ToList();
                
                foreach (var imgToDelete in imagesToDelete)
                {
                    existingProduct.Images.Remove(imgToDelete);
                    
                    // Xóa khỏi Cloudinary nếu có PublicId
                    if (!string.IsNullOrEmpty(imgToDelete.CloudinaryPublicId))
                    {
                        try
                        {
                            await _cloudinaryService.DeleteImageAsync(imgToDelete.CloudinaryPublicId);
                            _logger.LogInformation("🗑️ Deleted from Cloudinary: {PublicId}", imgToDelete.CloudinaryPublicId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete image from Cloudinary: {PublicId}", imgToDelete.CloudinaryPublicId);
                        }
                    }
                }
                
                // Step 2: Cập nhật SortOrder và ColorCode cho ảnh cũ GIỮ LẠI
                int currentIndex = 0;
                foreach (var imageUrl in keptImageUrls)
                {
                    var existingImage = existingProduct.Images.FirstOrDefault(img => img.ImageUrl == imageUrl);
                    if (existingImage != null)
                    {
                        // Tự động map: ảnh 0 = primary (no color), ảnh i+ = map với màu tương ứng
                        string? colorCode = null;
                        if (currentIndex > 0 && colorsList.Count > 0)
                        {
                            int colorIndex = currentIndex - 1;
                            if (colorIndex < colorsList.Count)
                            {
                                colorCode = colorsList[colorIndex].ToLower();
                            }
                        }
                        
                        existingImage.SortOrder = currentIndex;
                        existingImage.ColorCode = colorCode;
                        existingImage.IsPrimary = currentIndex == 0;
                        
                        _logger.LogInformation(
                            "♻️ REUSED image {Index}: {Type} (ColorCode: {ColorCode}) - SAVED Cloudinary storage!", 
                            currentIndex, 
                            currentIndex == 0 ? "PRIMARY" : "COLOR_MAPPED", 
                            colorCode ?? "none"
                        );
                        
                        currentIndex++;
                    }
                }
                
                
                // Step 3: Upload và ADD ảnh mới từ imageFiles
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
                                    // Tự động map: tiếp tục từ currentIndex
                                    string? colorCode = null;
                                    if (currentIndex > 0 && colorsList.Count > 0)
                                    {
                                        int colorIndex = currentIndex - 1;
                                        if (colorIndex < colorsList.Count)
                                        {
                                            colorCode = colorsList[colorIndex].ToLower();
                                        }
                                    }
                                    
                                    existingProduct.Images.Add(new ProductImage
                                    {
                                        ProductId = id,
                                        ImageUrl = uploadResult.SecureUrl.ToString(),
                                        CloudinaryPublicId = uploadResult.PublicId,
                                        ColorCode = colorCode,
                                        SortOrder = currentIndex,
                                        IsPrimary = currentIndex == 0
                                    });
                                    
                                    _logger.LogInformation(
                                        "📸 NEW image uploaded at index {Index}: {Type} (ColorCode: {ColorCode})", 
                                        currentIndex, 
                                        currentIndex == 0 ? "PRIMARY" : "COLOR_MAPPED", 
                                        colorCode ?? "none"
                                    );
                                    
                                    currentIndex++;
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to upload image file {FileName} for product {ProductId}", file.FileName, id);
                            }
                        }
                    }
                }
                
            // Removed: Sticker handling - use Sticker Library instead
            
            var updatedProduct = await _productRepository.UpdateAsync(existingProduct);
            
            // Handle warehouse stock update if primary warehouse is specified (only for regular products)
            if (updateProductDto.PrimaryWarehouseId.HasValue && updateProductDto.Stock.HasValue && updateProductDto.Stock.Value > 0)
            {
                // Check if warehouse stock already exists
                var existingStock = await _productWarehouseStockRepository.GetByProductAndWarehouseAsync(id, updateProductDto.PrimaryWarehouseId.Value);
                
                if (existingStock != null)
                {
                    // Update existing stock
                    existingStock.Stock = updateProductDto.Stock.Value; // Convert nullable int to int
                    await _productWarehouseStockRepository.UpdateAsync(existingStock);
                }
                else
                {
                    // Create new warehouse stock
                    var warehouseStock = new ProductWarehouseStock
                    {
                        ProductId = id,
                        WarehouseId = updateProductDto.PrimaryWarehouseId.Value,
                        Stock = updateProductDto.Stock.Value, // Convert nullable int to int
                        ReservedStock = 0
                    };
                    await _productWarehouseStockRepository.CreateAsync(warehouseStock);
                }
                
                // Update total stock in product
                updatedProduct.Stock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(id);
                await _productRepository.UpdateAsync(updatedProduct);
            }
            
            _logger.LogInformation("Product updated successfully: {ProductId} - {ProductName}", updatedProduct.Id, updatedProduct.Name);                return MapToResponseDto(updatedProduct);
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
                // ConsultationNote = product.ConsultationNote,  // REMOVED - not used for regular products
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
                }).ToList()
                // Removed: Stickers - use Sticker Library instead
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
        
        private string? ExtractCloudinaryPublicId(string imageUrl)
        {
            // Extract public_id from Cloudinary URL
            // Example: https://res.cloudinary.com/.../image/upload/v123456/products/abc123.jpg
            // Result: products/abc123
            try
            {
                var uri = new Uri(imageUrl);
                var pathParts = uri.AbsolutePath.Split('/');
                var uploadIndex = Array.IndexOf(pathParts, "upload");
                if (uploadIndex >= 0 && uploadIndex + 2 < pathParts.Length)
                {
                    // Skip version (v123456) and get folder/filename
                    var publicIdParts = pathParts.Skip(uploadIndex + 2).ToArray();
                    var publicId = string.Join("/", publicIdParts);
                    // Remove file extension
                    var lastDot = publicId.LastIndexOf('.');
                    if (lastDot > 0)
                    {
                        publicId = publicId.Substring(0, lastDot);
                    }
                    return publicId;
                }
            }
            catch
            {
                // If parsing fails, return null
            }
            return null;
        }

        public async Task<ProductSearchResponse> SearchProductsAsync(ProductSearchRequest request)
        {
            try
            {
                var (products, totalCount) = await _productRepository.SearchProductsAsync(
                    request.Search,
                    request.Category,
                    request.Status,
                    request.MinPrice,
                    request.MaxPrice,
                    request.MinStock,
                    request.SortBy,
                    request.SortDirection,
                    request.Page,
                    request.PageSize
                );

                var productDtos = products.Select(MapToResponseDto).ToList();
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                return new ProductSearchResponse
                {
                    IsSuccess = true,
                    Message = "Tìm kiếm sản phẩm thành công",
                    Products = productDtos,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching products");
                return new ProductSearchResponse
                {
                    IsSuccess = false,
                    Message = "Có lỗi xảy ra khi tìm kiếm sản phẩm",
                    Products = new List<ProductResponseDto>()
                };
            }
        }
    }

    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
    }
}
