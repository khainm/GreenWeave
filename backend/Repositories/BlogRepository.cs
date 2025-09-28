using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;

namespace backend.Repositories
{
    public class BlogRepository : IBlogRepository
    {
        private readonly ApplicationDbContext _context;

        public BlogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Blog>> GetAllAsync()
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> GetPublishedAsync()
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == "published")
                .OrderByDescending(b => b.PublishedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> GetByStatusAsync(string status)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == status)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> GetByAuthorAsync(string authorId)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.AuthorId == authorId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> GetByCategoryAsync(string category)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Category == category && b.Status == "published")
                .OrderByDescending(b => b.PublishedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> SearchAsync(string searchTerm)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == "published" && 
                           (b.Title.Contains(searchTerm) || 
                            b.Content.Contains(searchTerm) || 
                            b.Excerpt.Contains(searchTerm) ||
                            b.Tags.Contains(searchTerm)))
                .OrderByDescending(b => b.PublishedAt)
                .ToListAsync();
        }

        public async Task<Blog?> GetByIdAsync(int id)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Blog?> GetBySlugAsync(string slug)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .FirstOrDefaultAsync(b => b.Slug == slug);
        }

        public async Task<Blog> CreateAsync(Blog blog)
        {
            blog.CreatedAt = DateTime.UtcNow;
            blog.UpdatedAt = DateTime.UtcNow;
            
            if (blog.Status == "published")
            {
                blog.PublishedAt = DateTime.UtcNow;
            }

            _context.Blogs.Add(blog);
            await _context.SaveChangesAsync();
            return blog;
        }

        public async Task<Blog> UpdateAsync(Blog blog)
        {
            blog.UpdatedAt = DateTime.UtcNow;
            
            if (blog.Status == "published" && !blog.PublishedAt.HasValue)
            {
                blog.PublishedAt = DateTime.UtcNow;
            }

            _context.Blogs.Update(blog);
            await _context.SaveChangesAsync();
            return blog;
        }

        public async Task DeleteAsync(int id)
        {
            var blog = await _context.Blogs.FindAsync(id);
            if (blog != null)
            {
                _context.Blogs.Remove(blog);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Blogs.AnyAsync(b => b.Id == id);
        }

        public async Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        {
            var query = _context.Blogs.Where(b => b.Slug == slug);
            
            if (excludeId.HasValue)
            {
                query = query.Where(b => b.Id != excludeId.Value);
            }
            
            return await query.AnyAsync();
        }

        public async Task IncrementViewCountAsync(int id, string ipAddress, string? userAgent = null)
        {
            // Check if this IP has already viewed this blog recently (within 24 hours)
            var recentView = await _context.BlogViews
                .Where(bv => bv.BlogId == id && bv.IpAddress == ipAddress)
                .Where(bv => bv.ViewedAt > DateTime.UtcNow.AddHours(-24))
                .FirstOrDefaultAsync();

            if (recentView == null)
            {
                // Add new view record
                var blogView = new BlogView
                {
                    BlogId = id,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    ViewedAt = DateTime.UtcNow
                };
                _context.BlogViews.Add(blogView);

                // Increment view count
                var blog = await _context.Blogs.FindAsync(id);
                if (blog != null)
                {
                    blog.ViewCount++;
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> LikeBlogAsync(int id, string userId)
        {
            // Check if user has already liked this blog
            var existingLike = await _context.BlogLikes
                .FirstOrDefaultAsync(bl => bl.BlogId == id && bl.UserId == userId);

            if (existingLike != null)
            {
                return false; // Already liked
            }

            // Add new like
            var blogLike = new BlogLike
            {
                BlogId = id,
                UserId = userId,
                LikedAt = DateTime.UtcNow
            };
            _context.BlogLikes.Add(blogLike);

            // Increment like count
            var blog = await _context.Blogs.FindAsync(id);
            if (blog != null)
            {
                blog.LikeCount++;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnlikeBlogAsync(int id, string userId)
        {
            var existingLike = await _context.BlogLikes
                .FirstOrDefaultAsync(bl => bl.BlogId == id && bl.UserId == userId);

            if (existingLike == null)
            {
                return false; // Not liked
            }

            // Remove like
            _context.BlogLikes.Remove(existingLike);

            // Decrement like count
            var blog = await _context.Blogs.FindAsync(id);
            if (blog != null && blog.LikeCount > 0)
            {
                blog.LikeCount--;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasUserLikedAsync(int id, string userId)
        {
            return await _context.BlogLikes
                .AnyAsync(bl => bl.BlogId == id && bl.UserId == userId);
        }

        public async Task<IEnumerable<Blog>> GetRecentAsync(int count)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == "published")
                .OrderByDescending(b => b.PublishedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Blog>> GetPopularAsync(int count)
        {
            return await _context.Blogs
                .Include(b => b.Author)
                .Where(b => b.Status == "published")
                .OrderByDescending(b => b.ViewCount)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _context.Blogs
                .Where(b => b.Status == "published" && !string.IsNullOrEmpty(b.Category))
                .Select(b => b.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetTagsAsync()
        {
            var allTags = await _context.Blogs
                .Where(b => b.Status == "published" && !string.IsNullOrEmpty(b.Tags))
                .Select(b => b.Tags!)
                .ToListAsync();

            return allTags
                .SelectMany(tags => tags.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .Select(tag => tag.Trim())
                .Distinct()
                .OrderBy(tag => tag)
                .ToList();
        }
    }
}
