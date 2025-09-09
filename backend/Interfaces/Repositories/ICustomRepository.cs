using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface ICustomRepository
    {
        Task<CustomBaseProduct?> GetBaseProductAsync(int id);
        Task<IEnumerable<CustomBaseProduct>> ListBaseProductsAsync(int? categoryId = null);
        Task<CustomDesign> CreateDesignAsync(CustomDesign design);
        Task<CustomDesign?> GetDesignAsync(Guid id);
    }
}


