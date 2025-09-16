using backend.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Base
{
    public abstract class BaseController : ControllerBase
    {
        protected readonly ICurrentUserService _currentUserService;

        protected BaseController(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Kiểm tra xem user hiện tại có phải là chính chủ hoặc Admin không
        /// </summary>
        protected bool IsOwnerOrAdmin(string userId)
        {
            return _currentUserService.IsAdmin || _currentUserService.UserId == userId;
        }

        /// <summary>
        /// Kiểm tra xem user hiện tại có phải là Admin hoặc Staff không
        /// </summary>
        protected bool IsAdminOrStaff()
        {
            return _currentUserService.IsAdminOrStaff;
        }

        /// <summary>
        /// Trả về Forbidden nếu user không có quyền
        /// </summary>
        protected ActionResult ForbidAccess(string? message = null)
        {
            return StatusCode(403, new
            {
                success = false,
                message = message ?? "Bạn không có quyền truy cập tài nguyên này",
                statusCode = 403
            });
        }

        /// <summary>
        /// Trả về Unauthorized nếu user chưa đăng nhập
        /// </summary>
        protected ActionResult RequireAuthentication(string? message = null)
        {
            return Unauthorized(new
            {
                success = false,
                message = message ?? "Bạn cần đăng nhập để truy cập tài nguyên này",
                statusCode = 401
            });
        }

        /// <summary>
        /// Trả về response thành công với data
        /// </summary>
        protected ActionResult SuccessResponse<T>(T data, string? message = null)
        {
            return Ok(new
            {
                success = true,
                message = message ?? "Thành công",
                data = data
            });
        }

        /// <summary>
        /// Trả về response lỗi
        /// </summary>
        protected ActionResult ErrorResponse(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, new
            {
                success = false,
                message = message,
                statusCode = statusCode
            });
        }
    }
}
