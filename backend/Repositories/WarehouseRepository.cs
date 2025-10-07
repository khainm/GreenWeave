using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class WarehouseRepository : IWarehouseRepository
    {
        private readonly ApplicationDbContext _context;

        public WarehouseRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Warehouse>> GetAllAsync()
        {
            return await _context.Warehouses
                .Where(w => w.IsActive)
                .OrderBy(w => w.IsDefault ? 0 : 1)
                .ThenBy(w => w.Name)
                .ToListAsync();
        }

        public async Task<Warehouse?> GetByIdAsync(Guid id)
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);
        }

        public async Task<Warehouse?> GetDefaultAsync()
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(w => w.IsDefault && w.IsActive);
        }

        public async Task<Warehouse> CreateAsync(Warehouse warehouse)
        {
            // Nếu đây là kho mặc định, bỏ mặc định của các kho khác
            if (warehouse.IsDefault)
            {
                await UnsetAllDefaultsAsync();
            }

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();
            return warehouse;
        }

        public async Task<Warehouse> UpdateAsync(Warehouse warehouse)
        {
            // Nếu đây là kho mặc định, bỏ mặc định của các kho khác
            if (warehouse.IsDefault)
            {
                await UnsetAllDefaultsAsync(warehouse.Id);
            }

            warehouse.UpdatedAt = DateTime.UtcNow;
            _context.Warehouses.Update(warehouse);
            await _context.SaveChangesAsync();
            return warehouse;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return false;

            warehouse.IsActive = false;
            warehouse.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetAsDefaultAsync(Guid id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return false;

            // Bỏ mặc định của tất cả kho khác
            await UnsetAllDefaultsAsync(id);

            // Đặt kho này làm mặc định
            warehouse.IsDefault = true;
            warehouse.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Warehouses
                .AnyAsync(w => w.Id == id && w.IsActive);
        }

        private async Task UnsetAllDefaultsAsync(Guid? excludeId = null)
        {
            var query = _context.Warehouses.Where(w => w.IsDefault && w.IsActive);
            
            if (excludeId.HasValue)
            {
                query = query.Where(w => w.Id != excludeId.Value);
            }

            var warehouses = await query.ToListAsync();
            foreach (var warehouse in warehouses)
            {
                warehouse.IsDefault = false;
                warehouse.UpdatedAt = DateTime.UtcNow;
            }
            
            // Save changes after updating all warehouses
            if (warehouses.Any())
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Warehouse?> GetByAddressAsync(int provinceId, int districtId, int wardId, string addressDetail)
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(w => 
                    w.ProvinceId == provinceId && 
                    w.DistrictId == districtId && 
                    w.WardId == wardId && 
                    w.AddressDetail.ToLower() == addressDetail.ToLower() &&
                    w.IsActive);
        }

        public async Task<bool> HasDefaultWarehouseAsync()
        {
            return await _context.Warehouses
                .AnyAsync(w => w.IsDefault && w.IsActive);
        }
    }
}
