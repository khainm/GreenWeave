using backend.Models;
using backend.Data;
using backend.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Repository for managing customizable products data access
    /// Separates custom product queries from regular product operations
    /// </summary>
    public class CustomProductRepository : ICustomProductRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomProductRepository> _logger;
        
        public CustomProductRepository(
            ApplicationDbContext context,
            ILogger<CustomProductRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        public async Task<IEnumerable<Product>> GetCustomizableAsync()
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    // Removed: Stickers - use Sticker Library instead
                    .Where(p => _context.Categories
                        .Any(c => c.Name == p.Category && c.IsCustomizable))
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable products");
                throw;
            }
        }
        
        public async Task<IEnumerable<Product>> GetCustomizableAsync(int page, int pageSize)
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Images.OrderBy(i => i.SortOrder))
                    .Include(p => p.Colors.OrderBy(c => c.SortOrder))
                    // Removed: Stickers - use Sticker Library instead
                    .Where(p => _context.Categories
                        .Any(c => c.Name == p.Category && c.IsCustomizable))
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting paginated customizable products");
                throw;
            }
        }
        
        public async Task<int> GetCustomizableTotalCountAsync()
        {
            try
            {
                return await _context.Products
                    .Where(p => _context.Categories
                        .Any(c => c.Name == p.Category && c.IsCustomizable))
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable product count");
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
                    // Removed: Stickers - use Sticker Library instead
                    .FirstOrDefaultAsync(p => p.Id == id && _context.Categories
                        .Any(c => c.Name == p.Category && c.IsCustomizable));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable product by id: {Id}", id);
                throw;
            }
        }
        
        public async Task<bool> IsProductCustomizableAsync(int productId)
        {
            try
            {
                return await _context.Products
                    .Where(p => p.Id == productId)
                    .AnyAsync(p => _context.Categories
                        .Any(c => c.Name == p.Category && c.IsCustomizable));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if product is customizable: {ProductId}", productId);
                throw;
            }
        }
        
        // Removed: GetProductStickersAsync - Stickers moved to external Sticker Library
        
        public async Task<List<ProductColor>> GetProductColorsAsync(int productId)
        {
            try
            {
                return await _context.ProductColors
                    .Where(c => c.ProductId == productId)
                    .OrderBy(c => c.SortOrder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting colors for product: {ProductId}", productId);
                throw;
            }
        }
    }
}
