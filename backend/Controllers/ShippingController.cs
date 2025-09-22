using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Interfaces.Services;
using backend.DTOs;
using backend.Models;
using backend.Extensions;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for shipping operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ShippingController : ControllerBase
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<ShippingController> _logger;

        public ShippingController(IShippingService shippingService, ILogger<ShippingController> logger)
        {
            _shippingService = shippingService;
            _logger = logger;
        }

        /// <summary>
        /// Calculate shipping fees for all available providers
        /// </summary>
        /// <param name="request">Fee calculation request</param>
        /// <returns>Available shipping options with fees</returns>
        /// <response code="200">Returns shipping options successfully</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("calculate-fee")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ShippingOptionsResponseDto>> CalculateFee(
            [FromBody] CalculateShippingFeeRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var options = await _shippingService.GetShippingOptionsAsync(request);
                return Ok(new { success = true, data = options });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating shipping fees");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tính phí vận chuyển" });
            }
        }

        /// <summary>
        /// Create shipment for an order (Admin/Staff only)
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <param name="request">Shipment creation request</param>
        /// <returns>Shipment creation result</returns>
        /// <response code="200">Shipment created successfully</response>
        /// <response code="400">Failed to create shipment</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Order not found</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("create/{orderId}")]
        [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Staff)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CreateShipmentResult>> CreateShipment(
            [Required] int orderId, 
            [FromBody] CreateShipmentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                request.OrderId = orderId;
                var result = await _shippingService.CreateShipmentAsync(request);

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Shipment created successfully for order {OrderId} by user {UserId}", 
                        orderId, User.GetUserId());
                    return Ok(new { success = true, data = result, message = "Tạo vận đơn thành công" });
                }
                else
                {
                    _logger.LogWarning("Failed to create shipment for order {OrderId}: {Error}", 
                        orderId, result.ErrorMessage);
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipment for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo vận đơn" });
            }
        }

        /// <summary>
        /// Cancel shipment (Admin/Staff only)
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <param name="request">Cancellation request</param>
        /// <returns>Cancellation result</returns>
        /// <response code="200">Shipment cancelled successfully</response>
        /// <response code="400">Failed to cancel shipment</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Order not found</response>
        /// <response code="500">Internal server error</response>
        [HttpPost("cancel/{orderId}")]
        [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Staff)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<CancelShipmentResult>> CancelShipment(
            [Required] int orderId, 
            [FromBody] CancelShipmentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var result = await _shippingService.CancelShipmentAsync(orderId, request.Reason);

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Shipment cancelled successfully for order {OrderId} by user {UserId}", 
                        orderId, User.GetUserId());
                    return Ok(new { success = true, data = result, message = "Hủy vận đơn thành công" });
                }
                else
                {
                    _logger.LogWarning("Failed to cancel shipment for order {OrderId}: {Error}", 
                        orderId, result.ErrorMessage);
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling shipment for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi hủy vận đơn" });
            }
        }

        /// <summary>
        /// Get tracking information for an order
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>Tracking information</returns>
        /// <response code="200">Returns tracking information</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Tracking information not found</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("track/{orderId}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TrackingResponseDto>> GetTracking([Required] int orderId)
        {
            try
            {
                // Check permissions: only order owner, admin, or staff can track
                var currentUserId = User.GetUserId();
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);

                if (!isAdminOrStaff)
                {
                    // TODO: Add method to check if user owns the order
                    // For now, we'll implement this in the service layer
                }

                var tracking = await _shippingService.GetTrackingAsync(orderId);

                if (tracking != null)
                {
                    return Ok(new { success = true, data = tracking });
                }
                else
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin vận chuyển" });
                }
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tracking for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin vận chuyển" });
            }
        }

        /// <summary>
        /// Get shipping request details for an order (Admin/Staff only)
        /// </summary>
        /// <param name="orderId">Order ID</param>
        /// <returns>Shipping request information</returns>
        /// <response code="200">Returns shipping request details</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Shipping request not found</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("request/{orderId}")]
        [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Staff)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ShippingRequestResponseDto>> GetShippingRequest([Required] int orderId)
        {
            try
            {
                var shippingRequest = await _shippingService.GetShippingRequestAsync(orderId);

                if (shippingRequest != null)
                {
                    return Ok(new { success = true, data = shippingRequest });
                }
                else
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin yêu cầu vận chuyển" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping request for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin yêu cầu vận chuyển" });
            }
        }
    }

    /// <summary>
    /// Request DTO for cancelling shipment
    /// </summary>
    public class CancelShipmentRequest
    {
        [Required]
        [StringLength(500, ErrorMessage = "Lý do hủy không được vượt quá 500 ký tự")]
        public string Reason { get; set; } = string.Empty;
    }
}
