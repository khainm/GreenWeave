using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;

namespace backend.Repositories
{
    public class ProductWarehouseStockRepository : IProductWarehouseStockRepository
    {
        private readonly ApplicationDbContext _context;

        public ProductWarehouseStockRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductWarehouseStock>> GetAllAsync()
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Product)
                .Include(pws => pws.Warehouse)
                .ToListAsync();
        }

        public async Task<ProductWarehouseStock?> GetByIdAsync(int id)
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Product)
                .Include(pws => pws.Warehouse)
                .FirstOrDefaultAsync(pws => pws.Id == id);
        }

        public async Task<ProductWarehouseStock?> GetByProductAndWarehouseAsync(int productId, Guid warehouseId)
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Product)
                .Include(pws => pws.Warehouse)
                .FirstOrDefaultAsync(pws => pws.ProductId == productId && pws.WarehouseId == warehouseId);
        }

        public async Task<IEnumerable<ProductWarehouseStock>> GetByProductIdAsync(int productId)
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Warehouse)
                .Where(pws => pws.ProductId == productId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProductWarehouseStock>> GetByWarehouseIdAsync(Guid warehouseId)
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Product)
                .Where(pws => pws.WarehouseId == warehouseId)
                .ToListAsync();
        }

        public async Task<ProductWarehouseStock> CreateAsync(ProductWarehouseStock productWarehouseStock)
        {
            _context.ProductWarehouseStocks.Add(productWarehouseStock);
            await _context.SaveChangesAsync();
            return productWarehouseStock;
        }

        public async Task<ProductWarehouseStock> UpdateAsync(ProductWarehouseStock productWarehouseStock)
        {
            productWarehouseStock.UpdatedAt = DateTime.UtcNow;
            _context.ProductWarehouseStocks.Update(productWarehouseStock);
            await _context.SaveChangesAsync();
            return productWarehouseStock;
        }

        public async Task DeleteAsync(int id)
        {
            var productWarehouseStock = await _context.ProductWarehouseStocks.FindAsync(id);
            if (productWarehouseStock != null)
            {
                _context.ProductWarehouseStocks.Remove(productWarehouseStock);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int productId, Guid warehouseId)
        {
            return await _context.ProductWarehouseStocks
                .AnyAsync(pws => pws.ProductId == productId && pws.WarehouseId == warehouseId);
        }

        public async Task<int> GetTotalStockByProductIdAsync(int productId)
        {
            return await _context.ProductWarehouseStocks
                .Where(pws => pws.ProductId == productId)
                .SumAsync(pws => pws.Stock);
        }

        public async Task<int> GetAvailableStockByProductIdAsync(int productId)
        {
            return await _context.ProductWarehouseStocks
                .Where(pws => pws.ProductId == productId)
                .SumAsync(pws => pws.Stock - pws.ReservedStock);
        }

        public async Task<IEnumerable<ProductWarehouseStock>> GetLowStockProductsAsync(int threshold = 10)
        {
            return await _context.ProductWarehouseStocks
                .Include(pws => pws.Product)
                .Include(pws => pws.Warehouse)
                .Where(pws => pws.Stock <= threshold)
                .ToListAsync();
        }
    }
}
