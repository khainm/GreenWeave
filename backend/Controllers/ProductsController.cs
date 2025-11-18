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
        private readonly ICategoryService _categoryService;
        private readonly ILogger<ProductsController> _logger;
        
        public ProductsController(IProductService productService, ICategoryService categoryService, ILogger<ProductsController> logger)
        {
            _productService = productService;
            _categoryService = categoryService;
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
        public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetAllProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _productService.GetAllProductsAsync(page, pageSize);
                return Ok(new {
                    success = true,
                    data = result.Items,
                    pagination = new {
                        page = result.Page,
                        pageSize = result.PageSize,
                        totalItems = result.TotalItems,
                        totalPages = result.TotalPages
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all products");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách sản phẩm" });
            }
        }

        /// <summary>
        /// Tìm kiếm và lọc sản phẩm
        /// </summary>
        /// <param name="request">Tham số tìm kiếm và lọc</param>
        /// <returns>Danh sách sản phẩm đã lọc</returns>
        [HttpPost("search")]
        [ProducesResponseType(typeof(ProductSearchResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ProductSearchResponse>> SearchProducts([FromBody] ProductSearchRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { success = false, message = "Request không hợp lệ" });
                }

                var result = await _productService.SearchProductsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching products");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tìm kiếm sản phẩm" });
            }
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
        /// Lấy tổng số lượng có thể bán (available stock) cho một sản phẩm
        /// </summary>
        [HttpGet("{id}/available-stock")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetAvailableStock([Required] int id, [FromServices] backend.Interfaces.Repositories.IProductWarehouseStockRepository pwsRepo)
        {
            try
            {
                var total = await pwsRepo.GetAvailableStockByProductIdAsync(id);
                return Ok(new { success = true, data = new { productId = id, availableStock = total } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available stock for product {ProductId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin tồn kho" });
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
                _logger.LogInformation("CreateProduct request received: Name={Name}, Category={Category}", request.Name, request.Category);
                _logger.LogInformation("📥 Received {ImageCount} image files, {ColorCount} colors", 
                    request.ImageFiles?.Count() ?? 0, 
                    request.Colors?.Count() ?? 0);
                
                // Validate category and determine if it's customizable
                var categories = await _categoryService.GetAllAsync();
                var category = categories.FirstOrDefault(c => c.Name == request.Category);
                
                if (category == null)
                {
                    return BadRequest(new { success = false, message = $"Danh mục '{request.Category}' không tồn tại" });
                }
                
                bool isCustomProduct = category.IsCustomizable;
                _logger.LogInformation("Category '{CategoryName}' IsCustomizable: {IsCustomizable}", category.Name, isCustomProduct);
                
                // Apply validation rules based on product type
                if (isCustomProduct)
                {
                    // Custom products: Colors required (at least 1), Price/Stock/Weight must be null
                    if (request.Colors == null || !request.Colors.Any())
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm custom phải có ít nhất 1 màu" });
                    }
                    
                    // Clear regular product fields for custom products
                    request.Price = null;
                    request.OriginalPrice = null;
                    request.Stock = null;
                    request.Weight = null;
                    request.PrimaryWarehouseId = null;
                }
                else
                {
                    // Regular products: Price/Stock/Weight required, Colors optional
                    if (!request.Price.HasValue || request.Price.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có giá bán" });
                    }
                    
                    if (!request.Stock.HasValue)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có số lượng tồn kho" });
                    }
                    
                    if (!request.Weight.HasValue || request.Weight.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có khối lượng" });
                    }
                    
                    // Clear custom product fields for regular products
                    request.ConsultationNote = null;
                    request.EstimatedPriceMin = null;
                    request.EstimatedPriceMax = null;
                }
                
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState is invalid: {Errors}", string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }
                
            var createProductDto = new CreateProductDto
            {
                Name = request.Name,
                Sku = request.Sku,
                Category = request.Category,
                Description = request.Description,
                Price = request.Price ?? 0,
                OriginalPrice = request.OriginalPrice ?? 0,
                Stock = request.Stock ?? 0,
                Weight = request.Weight ?? 0,
                Status = request.Status,
                PrimaryWarehouseId = request.PrimaryWarehouseId,
                Colors = request.Colors ?? new List<string>(),
                ImageUrls = request.ImageUrls,
                ColorImageMap = null, // mapping sẽ đi qua file upload theo chuẩn hiện tại
                ImageColorMode = request.ImageColorMode ?? "shared" // Mặc định: ảnh chung
            };                // Bind ColorImages from form data manually
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

                // Removed: Sticker file handling - use Sticker Library instead
                var product = await _productService.CreateProductAsync(createProductDto, request.ImageFiles?.ToList(), colorImages, null);
                
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
                _logger.LogInformation("UpdateProduct request received: ID={Id}, Name={Name}, Category={Category}", id, request.Name, request.Category);
                _logger.LogInformation("📥 UPDATE - Received {ImageCount} image files, {ImageUrlCount} image URLs, {ColorCount} colors", 
                    request.ImageFiles?.Count() ?? 0,
                    request.ImageUrls?.Count() ?? 0,
                    request.Colors?.Count() ?? 0);
                
                // Validate category and determine if it's customizable
                var categories = await _categoryService.GetAllAsync();
                var category = categories.FirstOrDefault(c => c.Name == request.Category);
                
                if (category == null)
                {
                    return BadRequest(new { success = false, message = $"Danh mục '{request.Category}' không tồn tại" });
                }
                
                bool isCustomProduct = category.IsCustomizable;
                _logger.LogInformation("Category '{CategoryName}' IsCustomizable: {IsCustomizable}", category.Name, isCustomProduct);
                
                // Apply validation rules based on product type
                if (isCustomProduct)
                {
                    // Custom products: Colors required (at least 1), Price/Stock/Weight must be null
                    if (request.Colors == null || !request.Colors.Any())
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm custom phải có ít nhất 1 màu" });
                    }
                    
                    // Clear regular product fields for custom products
                    request.Price = null;
                    request.OriginalPrice = null;
                    request.Stock = null;
                    request.Weight = null;
                    request.PrimaryWarehouseId = null;
                }
                else
                {
                    // Regular products: Price/Stock/Weight required, Colors optional
                    if (!request.Price.HasValue || request.Price.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có giá bán" });
                    }
                    
                    if (!request.Stock.HasValue)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có số lượng tồn kho" });
                    }
                    
                    if (!request.Weight.HasValue || request.Weight.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Sản phẩm thông thường phải có khối lượng" });
                    }
                    
                    // Clear custom product fields for regular products
                    request.ConsultationNote = null;
                    request.EstimatedPriceMin = null;
                    request.EstimatedPriceMax = null;
                }
                
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState is invalid: {Errors}", string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });
                }
                
                var updateProductDto = new CreateProductDto
            {
                Name = request.Name,
                Sku = request.Sku,
                Category = request.Category,
                Description = request.Description,
                Price = request.Price ?? 0,
                OriginalPrice = request.OriginalPrice ?? 0,
                Stock = request.Stock ?? 0,
                Weight = request.Weight ?? 0,
                Status = request.Status,
                PrimaryWarehouseId = request.PrimaryWarehouseId,
                Colors = request.Colors ?? new List<string>(),
                ImageUrls = request.ImageUrls,
                ImageColorMode = request.ImageColorMode ?? "shared" // Mặc định: ảnh chung
            };                // Removed: Sticker file handling - use Sticker Library instead
                var product = await _productService.UpdateProductAsync(id, updateProductDto, request.ImageFiles?.ToList(), null);
                
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
        /// Xóa sản phẩm (soft delete nếu có đơn hàng, hard delete nếu chỉ có draft)
        /// </summary>
        /// <param name="id">ID của sản phẩm cần xóa</param>
        /// <returns>Kết quả xóa sản phẩm</returns>
        /// <response code="200">Xóa sản phẩm thành công hoặc đánh dấu inactive</response>
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
                // Check if product exists before deleting
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm để xóa" });
                
                var result = await _productService.DeleteProductAsync(id);
                if (!result)
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm để xóa" });
                
                // Check if product was soft deleted (status changed to inactive)
                var updatedProduct = await _productService.GetProductByIdAsync(id);
                if (updatedProduct?.Status == "inactive")
                {
                    // Soft delete: Product has order history
                    return Ok(new 
                    { 
                        success = true, 
                        message = "Sản phẩm có lịch sử đơn hàng nên được đánh dấu 'Ngừng bán' thay vì xóa. Dữ liệu đơn hàng được bảo toàn.",
                        softDelete = true,
                        productId = id,
                        info = "Các thiết kế draft và yêu cầu tư vấn chưa thành đơn vẫn được giữ lại."
                    });
                }
                
                // Hard delete: Product had no orders, draft designs and consultation requests were removed
                return Ok(new 
                { 
                    success = true, 
                    message = "Xóa sản phẩm thành công",
                    softDelete = false,
                    info = "Các thiết kế nháp và yêu cầu tư vấn chưa thành đơn đã được xóa cùng sản phẩm."
                });
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
        
        // ===== Regular Product Fields (Required for non-customizable products) =====
        
        /// <summary>
        /// Giá bán sản phẩm (VND) - Chỉ dành cho sản phẩm thông thường
        /// </summary>
        /// <example>159000</example>
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán phải lớn hơn hoặc bằng 0")]
        public decimal? Price { get; set; }
        
        /// <summary>
        /// Giá gốc sản phẩm (VND) - Dùng để hiển thị giá sale
        /// </summary>
        /// <example>200000</example>
        [Range(0, double.MaxValue, ErrorMessage = "Giá gốc phải lớn hơn hoặc bằng 0")]
        public decimal? OriginalPrice { get; set; }
        
        /// <summary>
        /// Số lượng tồn kho - Chỉ dành cho sản phẩm thông thường
        /// </summary>
        /// <example>120</example>
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")]
        public int? Stock { get; set; }
        
        /// <summary>
        /// Khối lượng sản phẩm (gram) - Chỉ dành cho sản phẩm thông thường
        /// </summary>
        /// <example>500</example>
        [Range(0, double.MaxValue, ErrorMessage = "Khối lượng phải lớn hơn hoặc bằng 0 gram")]
        public decimal? Weight { get; set; }
        
        /// <summary>
        /// ID kho hàng chính để lưu trữ sản phẩm - Chỉ dành cho sản phẩm thông thường
        /// </summary>
        /// <example>123e4567-e89b-12d3-a456-426614174000</example>
        public Guid? PrimaryWarehouseId { get; set; }
        
        // ===== Custom Product Fields (Used for customizable products) =====
        
        /// <summary>
        /// Ghi chú tư vấn cho sản phẩm custom - Hướng dẫn khách hàng về cách đặt hàng
        /// </summary>
        /// <example>Liên hệ qua Facebook/Zalo để được tư vấn chi tiết về thiết kế và báo giá</example>
        [StringLength(500, ErrorMessage = "Ghi chú tư vấn không được quá 500 ký tự")]
        public string? ConsultationNote { get; set; }
        
        /// <summary>
        /// Giá ước tính tối thiểu cho sản phẩm custom (VND)
        /// </summary>
        /// <example>200000</example>
        [Range(0, double.MaxValue, ErrorMessage = "Giá ước tính tối thiểu phải lớn hơn hoặc bằng 0")]
        public decimal? EstimatedPriceMin { get; set; }
        
        /// <summary>
        /// Giá ước tính tối đa cho sản phẩm custom (VND)
        /// </summary>
        /// <example>500000</example>
        [Range(0, double.MaxValue, ErrorMessage = "Giá ước tính tối đa phải lớn hơn hoặc bằng 0")]
        public decimal? EstimatedPriceMax { get; set; }
        
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
        /// Chế độ map ảnh với màu: "per-color" hoặc "shared"
        /// per-color: mỗi màu có 1 ảnh riêng (ảnh 1 -> màu 1, ảnh 2 -> màu 2...)
        /// shared: tất cả màu dùng chung bộ ảnh (các ảnh là góc nhìn khác nhau)
        /// </summary>
        /// <example>shared</example>
        public string? ImageColorMode { get; set; }

        // Removed: StickerFiles, StickerUrls, Stickers - use Sticker Library instead
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
