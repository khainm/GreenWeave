using Microsoft.AspNetCore.Mvc;
using backend.Interfaces.Services;
using backend.DTOs;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
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
        /// <returns>Danh sách tất cả sản phẩm</returns>
        /// <response code="200">Trả về danh sách sản phẩm thành công</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
        /// Danh sách sản phẩm tùy chỉnh (thuộc danh mục isCustomizable)
        /// </summary>
        [HttpGet("customizable")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetCustomizableProducts()
        {
            var products = await _productService.GetCustomizableProductsAsync();
            return Ok(new { success = true, data = products });
        }

        /// <summary>
        /// Chi tiết sản phẩm tùy chỉnh theo id
        /// </summary>
        [HttpGet("customizable/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ProductResponseDto>> GetCustomizableProductById([Required] int id)
        {
            var product = await _productService.GetCustomizableProductByIdAsync(id);
            if (product == null) return NotFound(new { success = false, message = "Không tìm thấy" });
            return Ok(new { success = true, data = product });
        }
        
        /// <summary>
        /// Lấy sản phẩm theo ID
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns>Thông tin sản phẩm</returns>
        /// <response code="200">Trả về thông tin sản phẩm thành công</response>
        /// <response code="404">Không tìm thấy sản phẩm</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ProductResponseDto>> GetProductById([Required] int id)
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
        /// <param name="sku">SKU của sản phẩm</param>
        /// <returns>Thông tin sản phẩm</returns>
        /// <response code="200">Trả về thông tin sản phẩm thành công</response>
        /// <response code="404">Không tìm thấy sản phẩm với SKU này</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("sku/{sku}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ProductResponseDto>> GetProductBySku([Required] string sku)
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
        /// <param name="request">Thông tin sản phẩm cần tạo (form data)</param>
        /// <returns>Thông tin sản phẩm vừa được tạo</returns>
        /// <response code="201">Tạo sản phẩm thành công</response>
        /// <response code="400">Dữ liệu đầu vào không hợp lệ</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
                    ImageUrls = request.ImageUrls,
                    ColorImageMap = null, // mapping sẽ đi qua file upload theo chuẩn hiện tại
                    StickerUrls = request.StickerUrls
                };
                
// Bind ColorImages from form data manually
                var colorImages = new Dictionary<string, IFormFile>();
                if (Request.Form != null)
                {
                    foreach (var key in Request.Form.Keys)
                    {
                        if (key.StartsWith("ColorImages[") && key.EndsWith("]"))
                        {
                            var colorCode = key.Substring(12, key.Length - 13); // Remove "ColorImages[" and "]"
                            var file = Request.Form.Files[key];
                            if (file != null && file.Length > 0)
                            {
                                colorImages[colorCode] = file;
                            }
                        }
                    }
                }

                // Bind StickerUrls from form data manually
                var stickerUrls = new List<string>();
                if (Request.Form != null)
                {
                    foreach (var key in Request.Form.Keys)
                    {
                        if (key.StartsWith("StickerUrls[") && key.EndsWith("]"))
                        {
                            var url = Request.Form[key].ToString();
                            if (!string.IsNullOrWhiteSpace(url))
                            {
                                stickerUrls.Add(url);
                            }
                        }
                    }
                }
                
                // Override StickerUrls if manually bound from form data
                if (stickerUrls.Any())
                {
                    createProductDto.StickerUrls = stickerUrls;
                }
                var stickerFiles = request.StickerFiles?.ToList();
                var product = await _productService.CreateProductAsync(createProductDto, request.ImageFiles?.ToList(), colorImages, stickerFiles);
                
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
        /// <param name="id">ID của sản phẩm cần cập nhật</param>
        /// <param name="request">Thông tin sản phẩm cần cập nhật (form data)</param>
        /// <returns>Thông tin sản phẩm sau khi cập nhật</returns>
        /// <response code="200">Cập nhật sản phẩm thành công</response>
        /// <response code="400">Dữ liệu đầu vào không hợp lệ</response>
        /// <response code="404">Không tìm thấy sản phẩm</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ProductResponseDto>> UpdateProduct([Required] int id, [FromForm] CreateProductRequest request)
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
        /// <param name="id">ID của sản phẩm cần xóa</param>
        /// <returns>Kết quả xóa sản phẩm</returns>
        /// <response code="200">Xóa sản phẩm thành công</response>
        /// <response code="404">Không tìm thấy sản phẩm</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteProduct([Required] int id)
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
        /// Tạo SKU tự động theo danh mục
        /// </summary>
        /// <param name="request">Thông tin danh mục để tạo SKU</param>
        /// <returns>SKU được tạo tự động</returns>
        /// <response code="200">Tạo SKU thành công</response>
        /// <response code="400">Dữ liệu đầu vào không hợp lệ</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost("generate-sku")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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
    
    /// <summary>
    /// Model dữ liệu để tạo hoặc cập nhật sản phẩm
    /// </summary>
    public class CreateProductRequest
    {
        /// <summary>
        /// Tên sản phẩm
        /// </summary>
        /// <example>Túi Tote Non-stop Single</example>
        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên sản phẩm không được quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;
        
        /// <summary>
        /// Mã SKU sản phẩm
        /// </summary>
        /// <example>NONSTOP-001</example>
        [Required(ErrorMessage = "SKU là bắt buộc")]
        [StringLength(50, ErrorMessage = "SKU không được quá 50 ký tự")]
        public string Sku { get; set; } = string.Empty;
        
        /// <summary>
        /// Danh mục sản phẩm
        /// </summary>
        /// <example>Non-stop</example>
        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        [StringLength(100, ErrorMessage = "Danh mục không được quá 100 ký tự")]
        public string Category { get; set; } = string.Empty;
        
        /// <summary>
        /// Mô tả sản phẩm
        /// </summary>
        /// <example>Túi tote thân thiện môi trường với thiết kế hiện đại</example>
        [StringLength(1000, ErrorMessage = "Mô tả không được quá 1000 ký tự")]
        public string? Description { get; set; }
        
        /// <summary>
        /// Giá bán sản phẩm (VND)
        /// </summary>
        /// <example>159000</example>
        [Required(ErrorMessage = "Giá bán là bắt buộc")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }
        
        /// <summary>
        /// Giá gốc sản phẩm (VND) - Dùng để hiển thị giá sale
        /// </summary>
        /// <example>200000</example>
        [Range(0, double.MaxValue, ErrorMessage = "Giá gốc phải lớn hơn hoặc bằng 0")]
        public decimal? OriginalPrice { get; set; }
        
        /// <summary>
        /// Số lượng tồn kho
        /// </summary>
        /// <example>120</example>
        [Required(ErrorMessage = "Số lượng tồn kho là bắt buộc")]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")]
        public int Stock { get; set; }
        
        /// <summary>
        /// Trạng thái sản phẩm
        /// </summary>
        /// <example>active</example>
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        [RegularExpression("^(active|inactive)$", ErrorMessage = "Trạng thái phải là 'active' hoặc 'inactive'")]
        public string Status { get; set; } = "active";
        
        /// <summary>
        /// Danh sách mã màu (hex codes)
        /// </summary>
        /// <example>["#FF0000", "#00FF00", "#0000FF"]</example>
        public List<string>? Colors { get; set; }
        
        /// <summary>
        /// Danh sách URL hình ảnh có sẵn
        /// </summary>
        public List<string>? ImageUrls { get; set; }
        
        /// <summary>
        /// Files hình ảnh upload
        /// </summary>
        public IFormFile[]? ImageFiles { get; set; }

        /// <summary>
        /// Gửi ảnh theo màu trực tiếp qua form-data, key dạng: ColorImages[#RRGGBB]
        /// </summary>
        public Dictionary<string, IFormFile>? ColorImages { get; set; }

        /// <summary>
        /// Sticker của sản phẩm (PNG nền trong suốt), gửi nhiều file: StickerFiles
        /// </summary>
        public IFormFile[]? StickerFiles { get; set; }
        
        /// <summary>
        /// Sticker URLs từ internet, gửi dạng array: StickerUrls[0], StickerUrls[1], ...
        /// </summary>
        public List<string>? StickerUrls { get; set; }
    }
    
    /// <summary>
    /// Model dữ liệu để tạo SKU tự động
    /// </summary>
    public class GenerateSkuRequest
    {
        /// <summary>
        /// Danh mục sản phẩm để tạo SKU
        /// </summary>
        /// <example>Non-stop</example>
        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public string Category { get; set; } = string.Empty;
    }
}
