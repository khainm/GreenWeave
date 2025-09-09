using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface ICustomService
    {
        Task<IEnumerable<CustomBaseProductDto>> ListBaseProductsAsync(int? categoryId = null);
        Task<CustomBaseProductDto?> GetBaseProductAsync(int id);
        Task<Guid> CreateDesignAsync(CreateCustomDesignRequest request);
        Task<CreateCustomDesignRequest?> GetDesignRawAsync(Guid id);
    }
}


