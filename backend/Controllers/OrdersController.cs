using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Interfaces.Services;
using backend.DTOs;
using backend.Models;
using backend.Extensions;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;
        
        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }
        
        /// <summary>
        /// Lấy danh sách tất cả đơn hàng (Admin/Staff only)
        /// </summary>
        /// <returns>Danh sách tất cả đơn hàng</returns>
        /// <response code="200">Trả về danh sách đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetAllOrders()
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(new { success = true, data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all orders");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng với bộ lọc và phân trang (Admin/Staff only)
        /// </summary>
        /// <param name="filter">Bộ lọc đơn hàng</param>
        /// <returns>Danh sách đơn hàng đã lọc</returns>
        /// <response code="200">Trả về danh sách đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("filtered")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderListResponseDto>> GetFilteredOrders([FromQuery] OrderFilterDto filter)
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                var result = await _orderService.GetFilteredOrdersAsync(filter);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered orders");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
            }
        }
        
        /// <summary>
        /// Lấy đơn hàng theo ID
        /// </summary>
        /// <param name="id">ID của đơn hàng</param>
        /// <returns>Thông tin đơn hàng</returns>
        /// <response code="200">Trả về thông tin đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy đơn hàng</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderResponseDto>> GetOrderById([Required] int id)
        {
            try
            {
                var order = await _orderService.GetOrderByIdAsync(id);
                if (order == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

                // Check if user can access this order
                var currentUserId = User.GetUserId();
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                
                if (!isAdminOrStaff && order.CustomerId != currentUserId)
                {
                    return Forbid();
                }
                
                return Ok(new { success = true, data = order });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by id: {Id}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy đơn hàng theo số đơn hàng
        /// </summary>
        /// <param name="orderNumber">Số đơn hàng</param>
        /// <returns>Thông tin đơn hàng</returns>
        /// <response code="200">Trả về thông tin đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy đơn hàng</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("number/{orderNumber}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderResponseDto>> GetOrderByNumber([Required] string orderNumber)
        {
            try
            {
                var order = await _orderService.GetOrderByNumberAsync(orderNumber);
                if (order == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

                // Check if user can access this order
                var currentUserId = User.GetUserId();
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                
                if (!isAdminOrStaff && order.CustomerId != currentUserId)
                {
                    return Forbid();
                }
                
                return Ok(new { success = true, data = order });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by number: {OrderNumber}", orderNumber);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng của tôi
        /// </summary>
        /// <param name="status">Lọc theo trạng thái (không bắt buộc)</param>
        /// <param name="page">Số trang (mặc định: 1)</param>
        /// <param name="pageSize">Số lượng item trên mỗi trang (mặc định: 20)</param>
        /// <returns>Danh sách đơn hàng của người dùng hiện tại</returns>
        /// <response code="200">Trả về danh sách đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("my-orders")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderListResponseDto>> GetMyOrders(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var currentUserId = User.GetUserId();
                if (string.IsNullOrEmpty(currentUserId))
                    return Unauthorized();

                // Tạo filter cho customer hiện tại
                var filter = new OrderFilterDto
                {
                    CustomerId = currentUserId,
                    Status = !string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus) 
                        ? orderStatus : null,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _orderService.GetFilteredOrdersAsync(filter);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders for current user");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách đơn hàng" });
            }
        }
        
        /// <summary>
        /// Tạo đơn hàng mới
        /// </summary>
        /// <param name="createOrderDto">Thông tin đơn hàng</param>
        /// <returns>Đơn hàng đã tạo</returns>
        /// <response code="201">Tạo đơn hàng thành công</response>
        /// <response code="400">Dữ liệu không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto createOrderDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                // For customers, they can only create orders for themselves
                var currentUserId = User.GetUserId();
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                
                if (!isAdminOrStaff && createOrderDto.CustomerId != currentUserId)
                {
                    return Forbid();
                }

                var order = await _orderService.CreateOrderAsync(createOrderDto);
                return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, 
                    new { success = true, data = order });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid data when creating order");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo đơn hàng" });
            }
        }
        
        /// <summary>
        /// Cập nhật trạng thái đơn hàng (Admin/Staff only)
        /// </summary>
        /// <param name="id">ID đơn hàng</param>
        /// <param name="updateStatusDto">Trạng thái mới</param>
        /// <returns>Đơn hàng đã cập nhật</returns>
        /// <response code="200">Cập nhật trạng thái thành công</response>
        /// <response code="400">Dữ liệu không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy đơn hàng</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto updateStatusDto)
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                if (updateStatusDto == null)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không được để trống" });
                }

                // Log the incoming data for debugging
                System.Console.WriteLine($"Received status update for order {id}: Status={updateStatusDto.Status}, Notes={updateStatusDto.Notes}");

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? new string[0]
                        );
                    
                    return BadRequest(new { 
                        success = false, 
                        message = "Dữ liệu không hợp lệ", 
                        errors = errors,
                        receivedData = new { 
                            Status = updateStatusDto.Status.ToString(), 
                            Notes = updateStatusDto.Notes 
                        }
                    });
                }

                var order = await _orderService.UpdateOrderStatusAsync(id, updateStatusDto);
                return Ok(new { success = true, data = order });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi", error = ex.Message });
            }
        }
        
        /// <summary>
        /// Xóa đơn hàng (Admin only)
        /// </summary>
        /// <param name="id">ID đơn hàng</param>
        /// <returns>Kết quả xóa</returns>
        /// <response code="200">Xóa đơn hàng thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy đơn hàng</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteOrder([Required] int id)
        {
            try
            {
                // Check if user is admin
                if (!User.IsInRole(UserRoles.Admin))
                {
                    return Forbid();
                }

                var result = await _orderService.DeleteOrderAsync(id);
                if (!result)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

                return Ok(new { success = true, message = "Xóa đơn hàng thành công" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation when deleting order {OrderId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order {OrderId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa đơn hàng" });
            }
        }

        /// <summary>
        /// Lấy thống kê đơn hàng (Admin/Staff only)
        /// </summary>
        /// <returns>Thống kê đơn hàng</returns>
        /// <response code="200">Trả về thống kê thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("stats")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderStatsDto>> GetOrderStats()
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                var stats = await _orderService.GetOrderStatsAsync();
                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order statistics");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thống kê đơn hàng" });
            }
        }

        /// <summary>
        /// Thanh toán đơn hàng (Customer only)
        /// </summary>
        /// <param name="id">ID của đơn hàng</param>
        /// <returns>Thông tin đơn hàng sau khi thanh toán</returns>
        /// <response code="200">Thanh toán thành công</response>
        /// <response code="400">Dữ liệu không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy đơn hàng</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost("{id}/payment")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<OrderResponseDto>> ProcessPayment(int id)
        {
            try
            {
                var customerId = User.GetUserId();
                if (string.IsNullOrEmpty(customerId))
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                var order = await _orderService.ProcessPaymentAsync(id, customerId);
                return Ok(new { success = true, data = order, message = "Thanh toán thành công" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment for order: {OrderId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xử lý thanh toán" });
            }
        }
    }
}