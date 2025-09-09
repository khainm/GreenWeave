using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class CustomRepository : ICustomRepository
    {
        private readonly ApplicationDbContext _db;
        public CustomRepository(ApplicationDbContext db) { _db = db; }

        public async Task<CustomBaseProduct?> GetBaseProductAsync(int id)
        {
            return await _db.CustomBaseProducts
                .Include(p => p.Angles).ThenInclude(a => a.Layers)
                .Include(p => p.OptionGroups).ThenInclude(g => g.Options)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.Status == "active");
        }

        public async Task<IEnumerable<CustomBaseProduct>> ListBaseProductsAsync(int? categoryId = null)
        {
            var q = _db.CustomBaseProducts.AsNoTracking().Where(p => p.Status == "active");
            if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId.Value);
            return await q.ToListAsync();
        }

        public async Task<CustomDesign> CreateDesignAsync(CustomDesign design)
        {
            _db.CustomDesigns.Add(design);
            await _db.SaveChangesAsync();
            return design;
        }

        public async Task<CustomDesign?> GetDesignAsync(Guid id)
        {
            return await _db.CustomDesigns.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        }
    }
}


