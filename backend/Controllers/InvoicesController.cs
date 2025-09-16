using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Interfaces.Services;
using backend.DTOs;
using backend.Models;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoicesController> _logger;

        public InvoicesController(IInvoiceService invoiceService, ILogger<InvoicesController> logger)
        {
            _invoiceService = invoiceService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả hóa đơn (Admin/Staff only)
        /// </summary>
        /// <returns>Danh sách hóa đơn</returns>
        /// <response code="200">Trả về danh sách hóa đơn thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAllInvoices()
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                var invoices = await _invoiceService.GetAllInvoicesAsync();
                return Ok(new { success = true, data = invoices });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all invoices");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy danh sách hóa đơn" });
            }
        }

        /// <summary>
        /// Lấy hóa đơn theo ID
        /// </summary>
        /// <param name="id">ID của hóa đơn</param>
        /// <returns>Chi tiết hóa đơn</returns>
        /// <response code="200">Trả về hóa đơn thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy hóa đơn</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<InvoiceDto>> GetInvoiceById(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });

                // Check if user can access this invoice (Admin/Staff or customer who owns the invoice)
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                if (!isAdminOrStaff)
                {
                    // For customers, they can only see their own invoices
                    var userEmail = User.Identity?.Name;
                    if (userEmail != invoice.CustomerEmail)
                    {
                        return Forbid();
                    }
                }

                return Ok(new { success = true, data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by ID: {InvoiceId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin hóa đơn" });
            }
        }

        /// <summary>
        /// Lấy hóa đơn theo số hóa đơn
        /// </summary>
        /// <param name="invoiceNumber">Số hóa đơn</param>
        /// <returns>Chi tiết hóa đơn</returns>
        /// <response code="200">Trả về hóa đơn thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy hóa đơn</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("number/{invoiceNumber}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<InvoiceDto>> GetInvoiceByNumber(string invoiceNumber)
        {
            try
            {
                var invoice = await _invoiceService.GetInvoiceByNumberAsync(invoiceNumber);
                if (invoice == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });

                // Check if user can access this invoice (Admin/Staff or customer who owns the invoice)
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                if (!isAdminOrStaff)
                {
                    // For customers, they can only see their own invoices
                    var userEmail = User.Identity?.Name;
                    if (userEmail != invoice.CustomerEmail)
                    {
                        return Forbid();
                    }
                }

                return Ok(new { success = true, data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by number: {InvoiceNumber}", invoiceNumber);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin hóa đơn" });
            }
        }

        /// <summary>
        /// Tạo hóa đơn cho đơn hàng (Admin/Staff only)
        /// </summary>
        /// <param name="createInvoiceDto">Thông tin tạo hóa đơn</param>
        /// <returns>Hóa đơn được tạo</returns>
        /// <response code="201">Tạo hóa đơn thành công</response>
        /// <response code="400">Dữ liệu không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<InvoiceDto>> CreateInvoice([FromBody] CreateInvoiceDto createInvoiceDto)
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var invoice = await _invoiceService.CreateInvoiceAsync(createInvoiceDto);
                if (invoice == null)
                    return BadRequest(new { success = false, message = "Không thể tạo hóa đơn" });

                return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, 
                    new { success = true, data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice for order: {OrderId}", createInvoiceDto.OrderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo hóa đơn" });
            }
        }

        /// <summary>
        /// Tạo và gửi hóa đơn qua email (Admin/Staff only)
        /// </summary>
        /// <param name="request">Yêu cầu tạo hóa đơn</param>
        /// <returns>Kết quả tạo và gửi hóa đơn</returns>
        /// <response code="200">Tạo và gửi hóa đơn thành công</response>
        /// <response code="400">Dữ liệu không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost("generate")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> GenerateInvoice([FromBody] InvoiceGenerationRequest request)
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _invoiceService.GenerateInvoiceAsync(request.OrderId, request.SendEmail);
                if (!result)
                    return BadRequest(new { success = false, message = "Không thể tạo hóa đơn" });

                return Ok(new { success = true, message = "Hóa đơn đã được tạo và gửi thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating invoice for order: {OrderId}", request.OrderId);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo hóa đơn" });
            }
        }

        /// <summary>
        /// Gửi lại hóa đơn qua email (Admin/Staff only)
        /// </summary>
        /// <param name="id">ID của hóa đơn</param>
        /// <returns>Kết quả gửi hóa đơn</returns>
        /// <response code="200">Gửi hóa đơn thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy hóa đơn</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpPost("{id}/resend")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> ResendInvoice(int id)
        {
            try
            {
                // Check if user is admin or staff
                if (!User.IsInRole(UserRoles.Admin) && !User.IsInRole(UserRoles.Staff))
                {
                    return Forbid();
                }

                var result = await _invoiceService.ResendInvoiceAsync(id);
                if (!result)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn hoặc không thể gửi" });

                return Ok(new { success = true, message = "Hóa đơn đã được gửi lại thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending invoice: {InvoiceId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi gửi lại hóa đơn" });
            }
        }

        /// <summary>
        /// Tải xuống file PDF hóa đơn
        /// </summary>
        /// <param name="id">ID của hóa đơn</param>
        /// <returns>File PDF hóa đơn</returns>
        /// <response code="200">Tải xuống thành công</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="403">Không có quyền truy cập</response>
        /// <response code="404">Không tìm thấy hóa đơn hoặc file</response>
        /// <response code="500">Lỗi server nội bộ</response>
        [HttpGet("{id}/download")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DownloadInvoice(int id)
        {
            try
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
                if (invoice == null)
                    return NotFound(new { success = false, message = "Không tìm thấy hóa đơn" });

                // Check if user can access this invoice (Admin/Staff or customer who owns the invoice)
                var isAdminOrStaff = User.IsInRole(UserRoles.Admin) || User.IsInRole(UserRoles.Staff);
                if (!isAdminOrStaff)
                {
                    // For customers, they can only download their own invoices
                    var userEmail = User.Identity?.Name;
                    if (userEmail != invoice.CustomerEmail)
                    {
                        return Forbid();
                    }
                }

                if (string.IsNullOrEmpty(invoice.FilePath) || !System.IO.File.Exists(invoice.FilePath))
                {
                    return NotFound(new { success = false, message = "Không tìm thấy file hóa đơn" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(invoice.FilePath);
                var fileName = invoice.FileName ?? $"invoice_{invoice.InvoiceNumber}.pdf";

                return File(fileBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading invoice: {InvoiceId}", id);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải xuống hóa đơn" });
            }
        }
    }
}