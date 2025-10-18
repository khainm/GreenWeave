using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;
using backend.DTOs;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for managing customizable products
    /// Separated from regular ProductsController for better organization
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class CustomProductsController : ControllerBase
    {
        private readonly ICustomProductService _customProductService;
        private readonly ILogger<CustomProductsController> _logger;
        
        public CustomProductsController(
            ICustomProductService customProductService,
            ILogger<CustomProductsController> logger)
        {
            _customProductService = customProductService;
            _logger = logger;
        }
        
        /// <summary>
        /// Get all customizable products
        /// </summary>
        /// <returns>List of products that can be customized</returns>
        /// <response code="200">Returns the list of customizable products</response>
        /// <response code="500">Internal server error</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<CustomProductResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<CustomProductResponseDto>>> GetCustomizableProducts(
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            try
            {
                // If pagination params provided, return paginated result
                if (page.HasValue && pageSize.HasValue)
                {
                    var paginatedResult = await _customProductService.GetCustomizableProductsPaginatedAsync(
                        page.Value, 
                        pageSize.Value);
                    
                    return Ok(new
                    {
                        success = true,
                        data = paginatedResult.Items,
                        pagination = new
                        {
                            page = paginatedResult.Page,
                            pageSize = paginatedResult.PageSize,
                            totalItems = paginatedResult.TotalItems,
                            totalPages = paginatedResult.TotalPages
                        }
                    });
                }
                
                // Otherwise return all customizable products
                var products = await _customProductService.GetCustomizableProductsAsync();
                return Ok(new { success = true, data = products });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable products");
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy danh sách sản phẩm tùy chỉnh" 
                });
            }
        }
        
        /// <summary>
        /// Get a specific customizable product by ID
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>Customizable product details</returns>
        /// <response code="200">Returns the customizable product</response>
        /// <response code="404">Product not found or not customizable</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(CustomProductResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CustomProductResponseDto>> GetCustomizableProductById([Required] int id)
        {
            try
            {
                var product = await _customProductService.GetCustomizableProductByIdAsync(id);
                
                if (product == null)
                {
                    return NotFound(new 
                    { 
                        success = false, 
                        message = "Không tìm thấy sản phẩm tùy chỉnh" 
                    });
                }
                
                return Ok(new { success = true, data = product });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customizable product by id: {Id}", id);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy thông tin sản phẩm tùy chỉnh" 
                });
            }
        }
        
        /// <summary>
        /// Check if a product is customizable
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>Boolean indicating if product is customizable</returns>
        /// <response code="200">Returns customization status</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("{id}/is-customizable")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<bool>> IsProductCustomizable([Required] int id)
        {
            try
            {
                var isCustomizable = await _customProductService.IsProductCustomizableAsync(id);
                return Ok(new 
                { 
                    success = true, 
                    data = new { productId = id, isCustomizable } 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if product is customizable: {Id}", id);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Có lỗi xảy ra khi kiểm tra sản phẩm" 
                });
            }
        }
        
        // Removed: GetProductStickers endpoint - Stickers moved to external Sticker Library
        
        /// <summary>
        /// Get available colors for a customizable product
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>List of available colors</returns>
        /// <response code="200">Returns colors for the product</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("{id}/colors")]
        [ProducesResponseType(typeof(List<ProductColorDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<ProductColorDto>>> GetProductColors([Required] int id)
        {
            try
            {
                var colors = await _customProductService.GetProductColorsAsync(id);
                return Ok(new { success = true, data = colors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting colors for product: {Id}", id);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy màu sắc" 
                });
            }
        }
        
        /// <summary>
        /// Get all customization options for a product (colors only - stickers via Sticker Library)
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>All customization options</returns>
        /// <response code="200">Returns customization options</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("{id}/customization-options")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GetCustomizationOptions([Required] int id)
        {
            try
            {
                var colors = await _customProductService.GetProductColorsAsync(id);
                
                return Ok(new 
                { 
                    success = true, 
                    data = new 
                    { 
                        productId = id,
                        colors,
                        hasOptions = colors.Any()
                        // Stickers removed - use external Sticker Library instead
                    } 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customization options for product: {Id}", id);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Có lỗi xảy ra khi lấy tùy chọn tùy chỉnh" 
                });
            }
        }
    }
}
