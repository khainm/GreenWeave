using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _db;
        public CategoryRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            return await _db.Set<Category>().OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetFilteredAsync(bool? visible, bool? customizable)
        {
            var q = _db.Set<Category>().AsQueryable();
            if (visible.HasValue) q = q.Where(c => c.IsVisible == visible.Value);
            if (customizable.HasValue) q = q.Where(c => c.IsCustomizable == customizable.Value);
            return await q.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync();
        }

        public async Task<int> CountProductsAsync(int categoryId)
        {
            var cat = await _db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == categoryId);
            if (cat == null) return 0;
            return await _db.Products.CountAsync(p => p.CategoryId == categoryId || p.Category == cat.Name);
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            return await _db.Set<Category>().FindAsync(id);
        }

        public async Task<Category?> GetByCodeAsync(string code)
        {
            return await _db.Set<Category>().FirstOrDefaultAsync(c => c.Code == code);
        }

        public async Task<Category> AddAsync(Category category)
        {
            _db.Set<Category>().Add(category);
            await _db.SaveChangesAsync();
            return category;
        }

        public async Task<Category> UpdateAsync(Category category)
        {
            _db.Set<Category>().Update(category);
            await _db.SaveChangesAsync();
            return category;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _db.Set<Category>().FindAsync(id);
            if (existing == null) return false;
            _db.Set<Category>().Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CodeExistsAsync(string code, int? excludeId = null)
        {
            return await _db.Set<Category>().AnyAsync(c => c.Code == code && (!excludeId.HasValue || c.Id != excludeId.Value));
        }
    }
}


