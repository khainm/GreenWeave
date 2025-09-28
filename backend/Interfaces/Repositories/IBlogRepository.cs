using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IBlogRepository
    {
        Task<IEnumerable<Blog>> GetAllAsync();
        Task<IEnumerable<Blog>> GetPublishedAsync();
        Task<IEnumerable<Blog>> GetByStatusAsync(string status);
        Task<IEnumerable<Blog>> GetByAuthorAsync(string authorId);
        Task<IEnumerable<Blog>> GetByCategoryAsync(string category);
        Task<IEnumerable<Blog>> SearchAsync(string searchTerm);
        Task<Blog?> GetByIdAsync(int id);
        Task<Blog?> GetBySlugAsync(string slug);
        Task<Blog> CreateAsync(Blog blog);
        Task<Blog> UpdateAsync(Blog blog);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
        Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
        Task IncrementViewCountAsync(int id, string ipAddress, string? userAgent = null);
        Task<bool> LikeBlogAsync(int id, string userId);
        Task<bool> UnlikeBlogAsync(int id, string userId);
        Task<bool> HasUserLikedAsync(int id, string userId);
        Task<IEnumerable<Blog>> GetRecentAsync(int count);
        Task<IEnumerable<Blog>> GetPopularAsync(int count);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<IEnumerable<string>> GetTagsAsync();
    }
}
