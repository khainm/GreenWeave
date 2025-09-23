using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Attributes;
using backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductWarehouseStockController : ControllerBase
    {
        private readonly IProductWarehouseStockRepository _productWarehouseStockRepository;
        private readonly IProductRepository _productRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly ILogger<ProductWarehouseStockController> _logger;

        public ProductWarehouseStockController(
            IProductWarehouseStockRepository productWarehouseStockRepository,
            IProductRepository productRepository,
            IWarehouseRepository warehouseRepository,
            ILogger<ProductWarehouseStockController> logger)
        {
            _productWarehouseStockRepository = productWarehouseStockRepository;
            _productRepository = productRepository;
            _warehouseRepository = warehouseRepository;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả warehouse stock
        /// </summary>
        [HttpGet]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<ProductWarehouseStockDto>>> GetAll()
        {
            try
            {
                var stocks = await _productWarehouseStockRepository.GetAllAsync();
                var result = stocks.Select(MapToDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all warehouse stocks");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy warehouse stock theo product ID
        /// </summary>
        [HttpGet("product/{productId}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<ProductWarehouseStockDto>>> GetByProductId(int productId)
        {
            try
            {
                var stocks = await _productWarehouseStockRepository.GetByProductIdAsync(productId);
                var result = stocks.Select(MapToDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting warehouse stocks for product {ProductId}", productId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy warehouse stock theo warehouse ID
        /// </summary>
        [HttpGet("warehouse/{warehouseId}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<ProductWarehouseStockDto>>> GetByWarehouseId(Guid warehouseId)
        {
            try
            {
                var stocks = await _productWarehouseStockRepository.GetByWarehouseIdAsync(warehouseId);
                var result = stocks.Select(MapToDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting warehouse stocks for warehouse {WarehouseId}", warehouseId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy warehouse stock cụ thể
        /// </summary>
        [HttpGet("{id}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<ProductWarehouseStockDto>> GetById(int id)
        {
            try
            {
                var stock = await _productWarehouseStockRepository.GetByIdAsync(id);
                if (stock == null)
                    return NotFound();

                return Ok(MapToDto(stock));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting warehouse stock {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Tạo warehouse stock mới
        /// </summary>
        [HttpPost]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<ProductWarehouseStockDto>> Create([FromBody] CreateProductWarehouseStockDto dto)
        {
            try
            {
                // Validate product exists
                var product = await _productRepository.GetByIdAsync(dto.ProductId);
                if (product == null)
                    return BadRequest("Product not found");

                // Validate warehouse exists
                var warehouse = await _warehouseRepository.GetByIdAsync(dto.WarehouseId);
                if (warehouse == null)
                    return BadRequest("Warehouse not found");

                // Check if stock already exists for this product-warehouse combination
                if (await _productWarehouseStockRepository.ExistsAsync(dto.ProductId, dto.WarehouseId))
                    return BadRequest("Stock already exists for this product in this warehouse");

                var stock = new ProductWarehouseStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.WarehouseId,
                    Stock = dto.Stock,
                    ReservedStock = dto.ReservedStock
                };

                var createdStock = await _productWarehouseStockRepository.CreateAsync(stock);

                // Update total stock in product
                var totalStock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(dto.ProductId);
                product.Stock = totalStock;
                await _productRepository.UpdateAsync(product);

                _logger.LogInformation("Created warehouse stock: Product {ProductId}, Warehouse {WarehouseId}, Stock {Stock}", 
                    dto.ProductId, dto.WarehouseId, dto.Stock);

                return CreatedAtAction(nameof(GetById), new { id = createdStock.Id }, MapToDto(createdStock));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating warehouse stock");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Cập nhật warehouse stock
        /// </summary>
        [HttpPut("{id}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<ProductWarehouseStockDto>> Update(int id, [FromBody] UpdateProductWarehouseStockDto dto)
        {
            try
            {
                var stock = await _productWarehouseStockRepository.GetByIdAsync(id);
                if (stock == null)
                    return NotFound();

                stock.Stock = dto.Stock;
                stock.ReservedStock = dto.ReservedStock;

                var updatedStock = await _productWarehouseStockRepository.UpdateAsync(stock);

                // Update total stock in product
                var totalStock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(stock.ProductId);
                var product = await _productRepository.GetByIdAsync(stock.ProductId);
                if (product != null)
                {
                    product.Stock = totalStock;
                    await _productRepository.UpdateAsync(product);
                }

                _logger.LogInformation("Updated warehouse stock {Id}: Stock {Stock}, Reserved {ReservedStock}", 
                    id, dto.Stock, dto.ReservedStock);

                return Ok(MapToDto(updatedStock));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating warehouse stock {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Xóa warehouse stock
        /// </summary>
        [HttpDelete("{id}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var stock = await _productWarehouseStockRepository.GetByIdAsync(id);
                if (stock == null)
                    return NotFound();

                var productId = stock.ProductId;
                await _productWarehouseStockRepository.DeleteAsync(id);

                // Update total stock in product
                var totalStock = await _productWarehouseStockRepository.GetTotalStockByProductIdAsync(productId);
                var product = await _productRepository.GetByIdAsync(productId);
                if (product != null)
                {
                    product.Stock = totalStock;
                    await _productRepository.UpdateAsync(product);
                }

                _logger.LogInformation("Deleted warehouse stock {Id}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting warehouse stock {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy sản phẩm có stock thấp
        /// </summary>
        [HttpGet("low-stock")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<ProductWarehouseStockDto>>> GetLowStockProducts([FromQuery] int threshold = 10)
        {
            try
            {
                var lowStockProducts = await _productWarehouseStockRepository.GetLowStockProductsAsync(threshold);
                var result = lowStockProducts.Select(MapToDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting low stock products");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Lấy tổng quan stock của sản phẩm
        /// </summary>
        [HttpGet("summary/product/{productId}")]
        [RequireRole(UserRoles.Admin)]
        public async Task<ActionResult<ProductStockSummaryDto>> GetProductStockSummary(int productId)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(productId);
                if (product == null)
                    return NotFound("Product not found");

                var warehouseStocks = await _productWarehouseStockRepository.GetByProductIdAsync(productId);
                var totalStock = warehouseStocks.Sum(ws => ws.Stock);
                var totalReservedStock = warehouseStocks.Sum(ws => ws.ReservedStock);
                var totalAvailableStock = warehouseStocks.Sum(ws => ws.AvailableStock);

                var summary = new ProductStockSummaryDto
                {
                    ProductId = productId,
                    ProductName = product.Name,
                    ProductSku = product.Sku,
                    TotalStock = totalStock,
                    TotalReservedStock = totalReservedStock,
                    TotalAvailableStock = totalAvailableStock,
                    WarehouseStocks = warehouseStocks.Select(MapToDto).ToList()
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product stock summary for product {ProductId}", productId);
                return StatusCode(500, "Internal server error");
            }
        }

        private ProductWarehouseStockDto MapToDto(ProductWarehouseStock stock)
        {
            return new ProductWarehouseStockDto
            {
                Id = stock.Id,
                ProductId = stock.ProductId,
                ProductName = stock.Product?.Name ?? "",
                ProductSku = stock.Product?.Sku ?? "",
                WarehouseId = stock.WarehouseId,
                WarehouseName = stock.Warehouse?.Name ?? "",
                Stock = stock.Stock,
                ReservedStock = stock.ReservedStock,
                AvailableStock = stock.AvailableStock,
                CreatedAt = stock.CreatedAt,
                UpdatedAt = stock.UpdatedAt
            };
        }
    }
}
