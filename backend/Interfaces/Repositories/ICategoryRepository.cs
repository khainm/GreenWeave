using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllAsync();
        Task<IEnumerable<Category>> GetFilteredAsync(bool? visible, bool? customizable);
        Task<Category?> GetByIdAsync(int id);
        Task<Category?> GetByCodeAsync(string code);
        Task<Category> AddAsync(Category category);
        Task<Category> UpdateAsync(Category category);
        Task<bool> DeleteAsync(int id);
        Task<bool> CodeExistsAsync(string code, int? excludeId = null);
        Task<int> CountProductsAsync(int categoryId);
    }
}


