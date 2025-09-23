using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IWarehouseRepository
    {
        Task<IEnumerable<Warehouse>> GetAllAsync();
        Task<Warehouse?> GetByIdAsync(Guid id);
        Task<Warehouse?> GetDefaultAsync();
        Task<Warehouse> CreateAsync(Warehouse warehouse);
        Task<Warehouse> UpdateAsync(Warehouse warehouse);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> SetAsDefaultAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task<Warehouse?> GetByAddressAsync(int provinceId, int districtId, int wardId, string addressDetail);
    }
}
