using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IProductWarehouseStockRepository
    {
        Task<IEnumerable<ProductWarehouseStock>> GetAllAsync();
        Task<ProductWarehouseStock?> GetByIdAsync(int id);
        Task<ProductWarehouseStock?> GetByProductAndWarehouseAsync(int productId, Guid warehouseId);
        Task<IEnumerable<ProductWarehouseStock>> GetByProductIdAsync(int productId);
        Task<IEnumerable<ProductWarehouseStock>> GetByWarehouseIdAsync(Guid warehouseId);
        Task<ProductWarehouseStock> CreateAsync(ProductWarehouseStock productWarehouseStock);
        Task<ProductWarehouseStock> UpdateAsync(ProductWarehouseStock productWarehouseStock);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int productId, Guid warehouseId);
        Task<int> GetTotalStockByProductIdAsync(int productId);
        Task<int> GetAvailableStockByProductIdAsync(int productId);
        Task<IEnumerable<ProductWarehouseStock>> GetLowStockProductsAsync(int threshold = 10);
    }
}
