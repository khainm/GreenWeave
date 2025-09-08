using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ILogger<ProductsController> _logger;
        
        public ProductsController(IProductService productService, ILogger<ProductsController> logger)
        {
            _productService = productService;
            _logger = logger;
        }
        
        /// <summary>
        /// Lấy danh sách tất cả sản phẩm
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetAllProducts()
        {
            try
            {
                var products = await _productService.GetAllProductsAsync();
                return Ok(new { success = true, data = products });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all products");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách sản phẩm" });
            }
        }
        
        /// <summary>
        /// Lấy sản phẩm theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductResponseDto>> GetProductById(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });
                
                return Ok(new { success = true, data = product });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product by id: {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin sản phẩm" });
            }
        }
        
        /// <summary>
        /// Lấy sản phẩm theo SKU
        /// </summary>
        [HttpGet("sku/{sku}")]
        public async Task<ActionResult<ProductResponseDto>> GetProductBySku(string sku)
        {
            try
            {
                var product = await _productService.GetProductBySkuAsync(sku);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm với SKU này" });
                
                return Ok(new { success = true, data = product });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product by SKU: {Sku}", sku);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin sản phẩm" });
            }
        }
        
        /// <summary>
        /// Tạo sản phẩm mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProductResponseDto>> CreateProduct([FromForm] CreateProductRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }
                
                var createProductDto = new CreateProductDto
                {
                    Name = request.Name,
                    Sku = request.Sku,
                    Category = request.Category,
                    Description = request.Description,
                    Price = request.Price,
                    OriginalPrice = request.OriginalPrice,
                    Stock = request.Stock,
                    Status = request.Status,
                    Colors = request.Colors ?? new List<string>(),
                    ImageUrls = request.ImageUrls
                };
                
                var product = await _productService.CreateProductAsync(createProductDto, request.ImageFiles?.ToList());
                
                return CreatedAtAction(
                    nameof(GetProductById), 
                    new { id = product.Id }, 
                    new { success = true, message = "Tạo sản phẩm thành công", data = product }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product: {ProductName}", request.Name);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo sản phẩm" });
            }
        }
        
        /// <summary>
        /// Cập nhật sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductResponseDto>> UpdateProduct(int id, [FromForm] CreateProductRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }
                
                var updateProductDto = new CreateProductDto
                {
                    Name = request.Name,
                    Sku = request.Sku,
                    Category = request.Category,
                    Description = request.Description,
                    Price = request.Price,
                    OriginalPrice = request.OriginalPrice,
                    Stock = request.Stock,
                    Status = request.Status,
                    Colors = request.Colors ?? new List<string>(),
                    ImageUrls = request.ImageUrls
                };
                
                var product = await _productService.UpdateProductAsync(id, updateProductDto, request.ImageFiles?.ToList());
                
                return Ok(new { success = true, message = "Cập nhật sản phẩm thành công", data = product });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product: {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật sản phẩm" });
            }
        }
        
        /// <summary>
        /// Xóa sản phẩm
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                if (!result)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm để xóa" });
                
                return Ok(new { success = true, message = "Xóa sản phẩm thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product: {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa sản phẩm" });
            }
        }
        
        /// <summary>
        /// Tạo SKU tự động
        /// </summary>
        [HttpPost("generate-sku")]
        public async Task<ActionResult<string>> GenerateSku([FromBody] GenerateSkuRequest request)
        {
            try
            {
                var sku = await _productService.GenerateSkuAsync(request.Category);
                return Ok(new { success = true, data = new { sku } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SKU for category: {Category}", request.Category);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo SKU" });
            }
        }
    }
    
    // Request models for form data
    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int Stock { get; set; }
        public string Status { get; set; } = "active";
        public List<string>? Colors { get; set; }
        public List<string>? ImageUrls { get; set; }
        public IFormFile[]? ImageFiles { get; set; }
    }
    
    public class GenerateSkuRequest
    {
        public string Category { get; set; } = string.Empty;
    }
}
