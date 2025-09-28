using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;
using System.Text.RegularExpressions;

namespace backend.Services
{
    public class BlogService : IBlogService
    {
        private readonly IBlogRepository _blogRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<BlogService> _logger;

        public BlogService(
            IBlogRepository blogRepository,
            IUserRepository userRepository,
            ILogger<BlogService> logger)
        {
            _blogRepository = blogRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<BlogDto>> GetAllBlogsAsync()
        {
            var blogs = await _blogRepository.GetAllAsync();
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> GetPublishedBlogsAsync()
        {
            var blogs = await _blogRepository.GetPublishedAsync();
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> GetBlogsByStatusAsync(string status)
        {
            var blogs = await _blogRepository.GetByStatusAsync(status);
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> GetBlogsByAuthorAsync(string authorId)
        {
            var blogs = await _blogRepository.GetByAuthorAsync(authorId);
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> GetBlogsByCategoryAsync(string category)
        {
            var blogs = await _blogRepository.GetByCategoryAsync(category);
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> SearchBlogsAsync(string searchTerm)
        {
            var blogs = await _blogRepository.SearchAsync(searchTerm);
            return blogs.Select(MapToDto);
        }

        public async Task<BlogDto?> GetBlogByIdAsync(int id)
        {
            var blog = await _blogRepository.GetByIdAsync(id);
            return blog != null ? MapToDto(blog) : null;
        }

        public async Task<BlogDto?> GetBlogBySlugAsync(string slug)
        {
            var blog = await _blogRepository.GetBySlugAsync(slug);
            return blog != null ? MapToDto(blog) : null;
        }

        public async Task<BlogDto> CreateBlogAsync(CreateBlogDto createBlogDto, string authorId)
        {
            try
            {
                // Get author info
                var author = await _userRepository.GetByIdAsync(authorId);
                if (author == null)
                {
                    throw new ArgumentException("Author not found");
                }

                // Generate slug
                var slug = await GenerateSlugAsync(createBlogDto.Title);

                var blog = new Blog
                {
                    Title = createBlogDto.Title,
                    Slug = slug,
                    Excerpt = createBlogDto.Excerpt,
                    Content = createBlogDto.Content,
                    FeaturedImageUrl = createBlogDto.FeaturedImageUrl,
                    FeaturedImageAlt = createBlogDto.FeaturedImageAlt,
                    Status = createBlogDto.Status,
                    AuthorId = authorId,
                    AuthorName = author.FullName,
                    Tags = createBlogDto.Tags,
                    Category = createBlogDto.Category,
                    MetaTitle = createBlogDto.MetaTitle,
                    MetaDescription = createBlogDto.MetaDescription,
                    MetaKeywords = createBlogDto.MetaKeywords
                };

                var createdBlog = await _blogRepository.CreateAsync(blog);
                _logger.LogInformation("Blog created successfully: {BlogId} - {Title}", createdBlog.Id, createdBlog.Title);

                return MapToDto(createdBlog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog: {Title}", createBlogDto.Title);
                throw;
            }
        }

        public async Task<BlogDto> UpdateBlogAsync(int id, UpdateBlogDto updateBlogDto)
        {
            try
            {
                var existingBlog = await _blogRepository.GetByIdAsync(id);
                if (existingBlog == null)
                {
                    throw new ArgumentException($"Blog with ID {id} not found");
                }

                // Update properties
                existingBlog.Title = updateBlogDto.Title;
                existingBlog.Excerpt = updateBlogDto.Excerpt;
                existingBlog.Content = updateBlogDto.Content;
                existingBlog.FeaturedImageUrl = updateBlogDto.FeaturedImageUrl;
                existingBlog.FeaturedImageAlt = updateBlogDto.FeaturedImageAlt;
                existingBlog.Status = updateBlogDto.Status;
                existingBlog.Tags = updateBlogDto.Tags;
                existingBlog.Category = updateBlogDto.Category;
                existingBlog.MetaTitle = updateBlogDto.MetaTitle;
                existingBlog.MetaDescription = updateBlogDto.MetaDescription;
                existingBlog.MetaKeywords = updateBlogDto.MetaKeywords;

                // Generate new slug if title changed
                if (existingBlog.Title != updateBlogDto.Title)
                {
                    existingBlog.Slug = await GenerateSlugAsync(updateBlogDto.Title, id);
                }

                var updatedBlog = await _blogRepository.UpdateAsync(existingBlog);
                _logger.LogInformation("Blog updated successfully: {BlogId} - {Title}", updatedBlog.Id, updatedBlog.Title);

                return MapToDto(updatedBlog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog with ID: {BlogId}", id);
                throw;
            }
        }

        public async Task DeleteBlogAsync(int id)
        {
            try
            {
                await _blogRepository.DeleteAsync(id);
                _logger.LogInformation("Blog deleted successfully: {BlogId}", id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog with ID: {BlogId}", id);
                throw;
            }
        }

        public async Task<bool> BlogExistsAsync(int id)
        {
            return await _blogRepository.ExistsAsync(id);
        }

        public async Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        {
            return await _blogRepository.SlugExistsAsync(slug, excludeId);
        }

        public async Task IncrementViewCountAsync(int id, string ipAddress, string? userAgent = null)
        {
            await _blogRepository.IncrementViewCountAsync(id, ipAddress, userAgent);
        }

        public async Task<bool> LikeBlogAsync(int id, string userId)
        {
            return await _blogRepository.LikeBlogAsync(id, userId);
        }

        public async Task<bool> UnlikeBlogAsync(int id, string userId)
        {
            return await _blogRepository.UnlikeBlogAsync(id, userId);
        }

        public async Task<bool> HasUserLikedAsync(int id, string userId)
        {
            return await _blogRepository.HasUserLikedAsync(id, userId);
        }

        public async Task<IEnumerable<BlogDto>> GetRecentBlogsAsync(int count)
        {
            var blogs = await _blogRepository.GetRecentAsync(count);
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<BlogDto>> GetPopularBlogsAsync(int count)
        {
            var blogs = await _blogRepository.GetPopularAsync(count);
            return blogs.Select(MapToDto);
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _blogRepository.GetCategoriesAsync();
        }

        public async Task<IEnumerable<string>> GetTagsAsync()
        {
            return await _blogRepository.GetTagsAsync();
        }

        public async Task<int> GetActualViewCountAsync(int id)
        {
            return await _blogRepository.GetActualViewCountAsync(id);
        }

        public async Task<string> GenerateSlugAsync(string title, int? excludeId = null)
        {
            // Convert to lowercase and replace spaces with hyphens
            var slug = title.ToLowerInvariant()
                .Replace(" ", "-")
                .Replace("--", "-");

            // Remove special characters except hyphens
            slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

            // Remove multiple consecutive hyphens
            slug = Regex.Replace(slug, @"-+", "-");

            // Remove leading/trailing hyphens
            slug = slug.Trim('-');

            // Ensure slug is not empty
            if (string.IsNullOrEmpty(slug))
            {
                slug = "blog-post";
            }

            // Check if slug exists and append number if needed
            var originalSlug = slug;
            var counter = 1;
            while (await _blogRepository.SlugExistsAsync(slug, excludeId))
            {
                slug = $"{originalSlug}-{counter}";
                counter++;
            }

            return slug;
        }

        private static BlogDto MapToDto(Blog blog)
        {
            return new BlogDto
            {
                Id = blog.Id,
                Title = blog.Title,
                Slug = blog.Slug,
                Excerpt = blog.Excerpt,
                Content = blog.Content,
                FeaturedImageUrl = blog.FeaturedImageUrl,
                FeaturedImageAlt = blog.FeaturedImageAlt,
                Status = blog.Status,
                AuthorId = blog.AuthorId,
                AuthorName = blog.AuthorName,
                Tags = blog.Tags,
                Category = blog.Category,
                ViewCount = blog.ViewCount,
                LikeCount = blog.LikeCount,
                PublishedAt = blog.PublishedAt,
                CreatedAt = blog.CreatedAt,
                UpdatedAt = blog.UpdatedAt,
                MetaTitle = blog.MetaTitle,
                MetaDescription = blog.MetaDescription,
                MetaKeywords = blog.MetaKeywords
            };
        }
    }
}
