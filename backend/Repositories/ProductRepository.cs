using backend.Models;
using backend.Data;
using backend.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductRepository> _logger;
        
        public ProductRepository(ApplicationDbContext context, ILogger<ProductRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    .Include(p => p.Stickers.OrderBy(s => s.SortOrder))
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all products");
                throw;
            }
        }
        
        public async Task<Product?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    .Include(p => p.Stickers.OrderBy(s => s.SortOrder))
                    .FirstOrDefaultAsync(p => p.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product by id: {Id}", id);
                throw;
            }
        }
        
        public async Task<Product?> GetBySkuAsync(string sku)
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    .Include(p => p.Stickers.OrderBy(s => s.SortOrder))
                    .FirstOrDefaultAsync(p => p.Sku == sku);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product by SKU: {Sku}", sku);
                throw;
            }
        }
        
        public async Task<Product> CreateAsync(Product product)
        {
            try
            {
                product.CreatedAt = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;
                
                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Product created with ID: {Id}", product.Id);
                return product;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                throw;
            }
        }
        
        public async Task<Product> UpdateAsync(Product product)
        {
            try
            {
                product.UpdatedAt = DateTime.UtcNow;
                
                _context.Products.Update(product);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Product updated with ID: {Id}", product.Id);
                return product;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product with ID: {Id}", product.Id);
                throw;
            }
        }

        public async Task AddImagesAsync(int productId, IEnumerable<ProductImage> images)
        {
            try
            {
                foreach (var img in images)
                {
                    img.ProductId = productId;
                    _context.ProductImages.Add(img);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding images for product {Id}", productId);
                throw;
            }
        }

        public async Task ReplaceColorsAsync(int productId, IEnumerable<ProductColor> colors)
        {
            try
            {
                var existing = _context.ProductColors.Where(c => c.ProductId == productId);
                _context.ProductColors.RemoveRange(existing);
                foreach (var c in colors)
                {
                    c.ProductId = productId;
                    _context.ProductColors.Add(c);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error replacing colors for product {Id}", productId);
                throw;
            }
        }

        public async Task UpsertColorImageAsync(int productId, string colorCode, ProductImage image)
        {
            try
            {
                var existing = await _context.ProductImages
                    .FirstOrDefaultAsync(i => i.ProductId == productId && i.ColorCode == colorCode);
                if (existing != null)
                {
                    existing.ImageUrl = image.ImageUrl;
                    existing.CloudinaryPublicId = image.CloudinaryPublicId;
                    existing.SortOrder = image.SortOrder;
                    existing.IsPrimary = image.IsPrimary;
                }
                else
                {
                    image.ProductId = productId;
                    image.ColorCode = colorCode.ToLower();
                    _context.ProductImages.Add(image);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting color image for product {Id} - {Color}", productId, colorCode);
                throw;
            }
        }

        public async Task AddStickersAsync(int productId, IEnumerable<ProductSticker> stickers)
        {
            try
            {
                foreach (var s in stickers)
                {
                    s.ProductId = productId;
                    _context.ProductStickers.Add(s);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding stickers for product {Id}", productId);
                throw;
            }
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                    return false;
                
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Product deleted with ID: {Id}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product with ID: {Id}", id);
                throw;
            }
        }
        
        public async Task<bool> ExistsAsync(int id)
        {
            try
            {
                return await _context.Products.AnyAsync(p => p.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if product exists with ID: {Id}", id);
                throw;
            }
        }
        
        public async Task<bool> SkuExistsAsync(string sku, int? excludeId = null)
        {
            try
            {
                var query = _context.Products.Where(p => p.Sku == sku);
                
                if (excludeId.HasValue)
                    query = query.Where(p => p.Id != excludeId.Value);
                
                return await query.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if SKU exists: {Sku}", sku);
                throw;
            }
        }

        public async Task<IEnumerable<Product>> GetCustomizableAsync()
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    .Include(p => p.Stickers.OrderBy(s => s.SortOrder))
                    .Where(p => _context.Categories.Any(c => c.Name == p.Category && c.IsCustomizable))
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable products");
                throw;
            }
        }

        public async Task<Product?> GetCustomizableByIdAsync(int id)
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    .Include(p => p.Stickers.OrderBy(s => s.SortOrder))
                    .Where(p => _context.Categories.Any(c => c.Name == p.Category && c.IsCustomizable))
                    .FirstOrDefaultAsync(p => p.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable product by id: {Id}", id);
                throw;
            }
        }
        
        public async Task ClearStickersAsync(int productId)
        {
            try
            {
                var stickers = await _context.ProductStickers
                    .Where(s => s.ProductId == productId)
                    .ToListAsync();
                
                if (stickers.Any())
                {
                    _context.ProductStickers.RemoveRange(stickers);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing stickers for product: {ProductId}", productId);
                throw;
            }
        }

        public async Task ClearImagesAsync(int productId)
        {
            try
            {
                var images = await _context.ProductImages
                    .Where(i => i.ProductId == productId)
                    .ToListAsync();
                
                if (images.Any())
                {
                    _context.ProductImages.RemoveRange(images);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Cleared {Count} images for product: {ProductId}", images.Count, productId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing images for product: {ProductId}", productId);
                throw;
            }
        }
    }
}
