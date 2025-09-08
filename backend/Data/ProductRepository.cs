using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
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
    }
}
