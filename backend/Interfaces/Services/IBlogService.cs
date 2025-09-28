using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IBlogService
    {
        Task<IEnumerable<BlogDto>> GetAllBlogsAsync();
        Task<IEnumerable<BlogDto>> GetPublishedBlogsAsync();
        Task<IEnumerable<BlogDto>> GetBlogsByStatusAsync(string status);
        Task<IEnumerable<BlogDto>> GetBlogsByAuthorAsync(string authorId);
        Task<IEnumerable<BlogDto>> GetBlogsByCategoryAsync(string category);
        Task<IEnumerable<BlogDto>> SearchBlogsAsync(string searchTerm);
        Task<BlogDto?> GetBlogByIdAsync(int id);
        Task<BlogDto?> GetBlogBySlugAsync(string slug);
        Task<BlogDto> CreateBlogAsync(CreateBlogDto createBlogDto, string authorId);
        Task<BlogDto> UpdateBlogAsync(int id, UpdateBlogDto updateBlogDto);
        Task DeleteBlogAsync(int id);
        Task<bool> BlogExistsAsync(int id);
        Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
        Task IncrementViewCountAsync(int id, string ipAddress, string? userAgent = null);
        Task<bool> LikeBlogAsync(int id, string userId);
        Task<bool> UnlikeBlogAsync(int id, string userId);
        Task<bool> HasUserLikedAsync(int id, string userId);
        Task<IEnumerable<BlogDto>> GetRecentBlogsAsync(int count);
        Task<IEnumerable<BlogDto>> GetPopularBlogsAsync(int count);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<IEnumerable<string>> GetTagsAsync();
        Task<string> GenerateSlugAsync(string title, int? excludeId = null);
        Task<int> GetActualViewCountAsync(int id);
    }
}
