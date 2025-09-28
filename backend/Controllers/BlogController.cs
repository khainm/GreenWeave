using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Interfaces.Services;
using backend.Extensions;
using backend.Attributes;
using backend.Models;
using backend.Controllers.Base;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogController : BaseController
    {
        private readonly IBlogService _blogService;
        private readonly ILogger<BlogController> _logger;

        public BlogController(IBlogService blogService, ILogger<BlogController> logger, ICurrentUserService currentUserService)
            : base(currentUserService)
        {
            _blogService = blogService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả blog posts (Admin only)
        /// </summary>
        [HttpGet]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetAllBlogs()
        {
            try
            {
                var blogs = await _blogService.GetAllBlogsAsync();
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all blogs");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog posts đã publish (Public)
        /// </summary>
        [HttpGet("published")]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetPublishedBlogs()
        {
            try
            {
                var blogs = await _blogService.GetPublishedBlogsAsync();
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting published blogs");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog posts theo status (Admin only)
        /// </summary>
        [HttpGet("status/{status}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetBlogsByStatus(string status)
        {
            try
            {
                var blogs = await _blogService.GetBlogsByStatusAsync(status);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blogs by status: {Status}", status);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog posts theo category (Public)
        /// </summary>
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetBlogsByCategory(string category)
        {
            try
            {
                var blogs = await _blogService.GetBlogsByCategoryAsync(category);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blogs by category: {Category}", category);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Tìm kiếm blog posts (Public)
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<BlogDto>>> SearchBlogs([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest("Search query is required");
                }

                var blogs = await _blogService.SearchBlogsAsync(q);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching blogs: {Query}", q);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog post theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BlogDto>> GetBlogById(int id)
        {
            try
            {
                var blog = await _blogService.GetBlogByIdAsync(id);
                if (blog == null)
                {
                    return NotFound();
                }

                // Increment view count for published blogs
                if (blog.Status == "published")
                {
                    var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
                    await _blogService.IncrementViewCountAsync(id, ipAddress, userAgent);
                }

                return Ok(blog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blog by ID: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog post theo slug (Public)
        /// </summary>
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<BlogDto>> GetBlogBySlug(string slug)
        {
            try
            {
                var blog = await _blogService.GetBlogBySlugAsync(slug);
                if (blog == null)
                {
                    return NotFound();
                }

                // Only return published blogs for public access
                if (blog.Status != "published")
                {
                    return NotFound();
                }

                // Increment view count
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
                await _blogService.IncrementViewCountAsync(blog.Id, ipAddress, userAgent);

                return Ok(blog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blog by slug: {Slug}", slug);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Tạo blog post mới (Admin only)
        /// </summary>
        [HttpPost]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<BlogDto>> CreateBlog([FromBody] CreateBlogDto createBlogDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var authorId = _currentUserService.UserId;
                if (string.IsNullOrEmpty(authorId))
                {
                    return Unauthorized("User not authenticated");
                }
                
                var blog = await _blogService.CreateBlogAsync(createBlogDto, authorId);

                return CreatedAtAction(nameof(GetBlogById), new { id = blog.Id }, blog);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Cập nhật blog post (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<BlogDto>> UpdateBlog(int id, [FromBody] UpdateBlogDto updateBlogDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var blog = await _blogService.UpdateBlogAsync(id, updateBlogDto);
                return Ok(blog);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Xóa blog post (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult> DeleteBlog(int id)
        {
            try
            {
                await _blogService.DeleteBlogAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Like blog post (Public)
        /// </summary>
        [HttpPost("{id}/like")]
        public async Task<ActionResult> LikeBlog(int id)
        {
            try
            {
                var userId = _currentUserService.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User must be logged in to like a blog");
                }

                var liked = await _blogService.LikeBlogAsync(id, userId);
                if (liked)
                {
                    return Ok(new { message = "Blog liked successfully" });
                }
                else
                {
                    return Ok(new { message = "Blog already liked" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error liking blog: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Unlike blog post (Public)
        /// </summary>
        [HttpDelete("{id}/like")]
        public async Task<ActionResult> UnlikeBlog(int id)
        {
            try
            {
                var userId = _currentUserService.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User must be logged in to unlike a blog");
                }

                var unliked = await _blogService.UnlikeBlogAsync(id, userId);
                if (unliked)
                {
                    return Ok(new { message = "Blog unliked successfully" });
                }
                else
                {
                    return Ok(new { message = "Blog was not liked" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unliking blog: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Check if user has liked blog (Public)
        /// </summary>
        [HttpGet("{id}/like-status")]
        public async Task<ActionResult> GetLikeStatus(int id)
        {
            try
            {
                var userId = _currentUserService.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new { hasLiked = false });
                }

                var hasLiked = await _blogService.HasUserLikedAsync(id, userId);
                return Ok(new { hasLiked });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting like status for blog: {BlogId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog posts gần đây (Public)
        /// </summary>
        [HttpGet("recent/{count}")]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetRecentBlogs(int count = 5)
        {
            try
            {
                var blogs = await _blogService.GetRecentBlogsAsync(count);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent blogs");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy blog posts phổ biến (Public)
        /// </summary>
        [HttpGet("popular/{count}")]
        public async Task<ActionResult<IEnumerable<BlogDto>>> GetPopularBlogs(int count = 5)
        {
            try
            {
                var blogs = await _blogService.GetPopularBlogsAsync(count);
                return Ok(blogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular blogs");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy danh sách categories (Public)
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            try
            {
                var categories = await _blogService.GetCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy danh sách tags (Public)
        /// </summary>
        [HttpGet("tags")]
        public async Task<ActionResult<IEnumerable<string>>> GetTags()
        {
            try
            {
                var tags = await _blogService.GetTagsAsync();
                return Ok(tags);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tags");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
