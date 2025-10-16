using backend.Attributes;
using backend.DTOs;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [RequireRole(UserRoles.Admin)]
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;
        private readonly ILogger<WarehouseController> _logger;

        public WarehouseController(
            IWarehouseService warehouseService,
            ILogger<WarehouseController> logger)
        {
            _warehouseService = warehouseService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả kho hàng
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<WarehouseResponseDto>> GetAllWarehouses()
        {
            try
            {
                var result = await _warehouseService.GetAllWarehousesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllWarehouses");
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thông tin kho hàng theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseResponseDto>> GetWarehouse(Guid id)
        {
            try
            {
                var result = await _warehouseService.GetWarehouseByIdAsync(id);
                if (!result.Success)
                {
                    return NotFound(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetWarehouse: {Id}", id);
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy kho hàng mặc định
        /// </summary>
        [HttpGet("default")]
        public async Task<ActionResult<WarehouseResponseDto>> GetDefaultWarehouse()
        {
            try
            {
                var result = await _warehouseService.GetDefaultWarehouseAsync();
                if (!result.Success)
                {
                    return NotFound(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetDefaultWarehouse");
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Tạo kho hàng mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<WarehouseResponseDto>> CreateWarehouse([FromBody] CreateWarehouseDto createWarehouseDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        Errors = errors
                    });
                }

                var result = await _warehouseService.CreateWarehouseAsync(createWarehouseDto);
                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(nameof(GetWarehouse), new { id = result.Warehouse!.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateWarehouse");
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Cập nhật thông tin kho hàng
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<WarehouseResponseDto>> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseDto updateWarehouseDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    return BadRequest(new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        Errors = errors
                    });
                }

                var result = await _warehouseService.UpdateWarehouseAsync(id, updateWarehouseDto);
                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateWarehouse: {Id}", id);
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Xóa kho hàng
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<WarehouseResponseDto>> DeleteWarehouse(Guid id)
        {
            try
            {
                var result = await _warehouseService.DeleteWarehouseAsync(id);
                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteWarehouse: {Id}", id);
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Đặt kho hàng làm mặc định
        /// </summary>
        [HttpPost("{id}/set-default")]
        public async Task<ActionResult<WarehouseResponseDto>> SetAsDefault(Guid id)
        {
            try
            {
                var result = await _warehouseService.SetAsDefaultAsync(id);
                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SetAsDefault: {Id}", id);
                return StatusCode(500, new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Đăng ký kho hàng với ViettelPost
        /// </summary>
        [HttpPost("{id}/register")]
        public async Task<ActionResult<RegisterWarehouseResult>> RegisterWithViettelPost(Guid id)
        {
            try
            {
                _logger.LogInformation("🔄 [WAREHOUSE-CONTROLLER] Starting registration for warehouse: {Id}", id);
                
                var result = await _warehouseService.RegisterWithViettelPostAsync(id);
                
                _logger.LogInformation("📦 [WAREHOUSE-CONTROLLER] Registration result for warehouse {Id}: Success={Success}, GroupAddressId={GroupAddressId}, Error={Error}", 
                    id, result.IsSuccess, result.GroupAddressId, result.ErrorMessage);
                
                if (!result.IsSuccess)
                {
                    _logger.LogWarning("⚠️ [WAREHOUSE-CONTROLLER] Registration failed for warehouse {Id}: {ErrorMessage} (ErrorCode: {ErrorCode})", 
                        id, result.ErrorMessage, result.ErrorCode);
                    
                    // Return detailed error information for debugging
                    return BadRequest(new
                    {
                        IsSuccess = false,
                        ErrorMessage = result.ErrorMessage,
                        ErrorCode = result.ErrorCode,
                        Timestamp = DateTime.UtcNow,
                        WarehouseId = id,
                        Details = "Kiểm tra log server để biết thêm chi tiết"
                    });
                }

                _logger.LogInformation("✅ [WAREHOUSE-CONTROLLER] Registration successful for warehouse {Id} with GroupAddressId: {GroupAddressId}", 
                    id, result.GroupAddressId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [WAREHOUSE-CONTROLLER] Error in RegisterWithViettelPost: {Id}", id);
                return StatusCode(500, new RegisterWarehouseResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Lỗi hệ thống: {ex.Message}",
                    ErrorCode = 500
                });
            }
        }
    }
}
