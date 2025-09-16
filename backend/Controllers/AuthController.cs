using backend.DTOs;
using backend.Interfaces.Services;
using backend.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;

        public AuthController(IAuthService authService, ICurrentUserService currentUserService)
        {
            _authService = authService;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Đăng ký tài khoản người dùng mới
        /// </summary>
        /// <param name="registerDto">Thông tin đăng ký</param>
        /// <returns>Kết quả đăng ký và thông tin người dùng</returns>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu đăng ký không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var result = await _authService.RegisterAsync(registerDto);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đăng nhập vào hệ thống
        /// </summary>
        /// <param name="loginDto">Thông tin đăng nhập</param>
        /// <returns>Kết quả đăng nhập và JWT token</returns>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu đăng nhập không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var result = await _authService.LoginAsync(loginDto);
            
            if (!result.Success)
            {
                return Unauthorized(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin profile người dùng hiện tại
        /// </summary>
        /// <returns>Thông tin người dùng</returns>
        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var user = await _authService.GetUserProfileAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin người dùng" });
            }

            return Ok(user);
        }

        /// <summary>
        /// Cập nhật thông tin profile người dùng
        /// </summary>
        /// <param name="updateProfileDto">Thông tin cập nhật</param>
        /// <returns>Kết quả cập nhật</returns>
        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<AuthResponseDto>> UpdateProfile([FromBody] UpdateProfileDto updateProfileDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu cập nhật không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _authService.UpdateProfileAsync(userId, updateProfileDto);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đổi mật khẩu người dùng
        /// </summary>
        /// <param name="changePasswordDto">Thông tin đổi mật khẩu</param>
        /// <returns>Kết quả đổi mật khẩu</returns>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<AuthResponseDto>> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu đổi mật khẩu không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Upload avatar cho người dùng
        /// </summary>
        /// <param name="avatarFile">File ảnh avatar</param>
        /// <returns>Kết quả upload</returns>
        [HttpPost("upload-avatar")]
        [Authorize]
        [ApiExplorerSettings(IgnoreApi = true)] // Tạm thời ẩn khỏi Swagger
        public async Task<ActionResult<AuthResponseDto>> UploadAvatar([FromForm] IFormFile avatarFile)
        {
            if (avatarFile == null || avatarFile.Length == 0)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Vui lòng chọn file ảnh",
                    Errors = new List<string> { "File ảnh không được để trống" }
                });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(avatarFile.ContentType.ToLower()))
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "Định dạng file không hợp lệ",
                    Errors = new List<string> { "Chỉ chấp nhận file ảnh định dạng JPEG, PNG, GIF, WebP" }
                });
            }

            // Validate file size (max 5MB)
            if (avatarFile.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new AuthResponseDto
                {
                    Success = false,
                    Message = "File ảnh quá lớn",
                    Errors = new List<string> { "Kích thước file không được vượt quá 5MB" }
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new AuthResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _authService.UploadAvatarAsync(userId, avatarFile);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Kiểm tra token có hợp lệ không
        /// </summary>
        /// <returns>Thông tin xác thực</returns>
        [HttpGet("verify-token")]
        [Authorize]
        public ActionResult VerifyToken()
        {
            return Ok(new
            {
                success = true,
                message = "Token hợp lệ",
                user = new
                {
                    id = _currentUserService.UserId,
                    customerCode = _currentUserService.CustomerCode,
                    email = _currentUserService.Email,
                    fullName = _currentUserService.FullName,
                    roles = _currentUserService.Roles,
                    isAdmin = _currentUserService.IsAdmin,
                    isStaff = _currentUserService.IsStaff,
                    isCustomer = _currentUserService.IsCustomer
                }
            });
        }

        /// <summary>
        /// Lấy thông tin user hiện tại
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult> GetCurrentUser()
        {
            if (!_currentUserService.IsAuthenticated)
            {
                return Unauthorized("Bạn cần đăng nhập");
            }

            var userProfile = await _authService.GetUserProfileAsync(_currentUserService.UserId!);
            if (userProfile == null)
            {
                return NotFound("Không tìm thấy thông tin người dùng");
            }

            return Ok(new
            {
                success = true,
                data = userProfile
            });
        }

        /// <summary>
        /// Kiểm tra role của user hiện tại
        /// </summary>
        [HttpGet("my-roles")]
        [Authorize]
        public ActionResult GetMyRoles()
        {
            return Ok(new
            {
                success = true,
                data = _currentUserService.Roles,
                permissions = new
                {
                    isAdmin = _currentUserService.IsAdmin,
                    isStaff = _currentUserService.IsStaff,
                    isCustomer = _currentUserService.IsCustomer,
                    isAdminOrStaff = _currentUserService.IsAdminOrStaff
                }
            });
        }

        /// <summary>
        /// Test endpoint cho Admin
        /// </summary>
        [HttpGet("admin-test")]
        [Authorize(Roles = "Admin")]
        public ActionResult AdminTest()
        {
            return Ok(new { 
                message = "Bạn có quyền Admin!",
                user = _currentUserService.FullName,
                roles = _currentUserService.Roles
            });
        }

        /// <summary>
        /// Test endpoint cho Staff (sử dụng custom attribute)
        /// </summary>
        [HttpGet("staff-test")]
        [backend.Attributes.RequireRole("Admin", "Staff")]
        public ActionResult StaffTest()
        {
            return Ok(new { 
                message = "Bạn có quyền Staff hoặc Admin!",
                user = _currentUserService.FullName,
                roles = _currentUserService.Roles
            });
        }

        /// <summary>
        /// Test endpoint cho Customer
        /// </summary>
        [HttpGet("customer-test")]
        [Authorize]
        public ActionResult CustomerTest()
        {
            if (!_currentUserService.IsAuthenticated)
            {
                return Unauthorized("Bạn cần đăng nhập");
            }

            return Ok(new { 
                message = "Bạn đã đăng nhập thành công!",
                user = _currentUserService.FullName,
                roles = _currentUserService.Roles,
                customerCode = _currentUserService.CustomerCode
            });
        }

        /// <summary>
        /// Test endpoint chỉ dành cho Admin hoặc chính chủ
        /// </summary>
        [HttpGet("profile/{userId}")]
        [Authorize]
        public async Task<ActionResult> GetUserProfile(string userId)
        {
            // Admin có thể xem bất kỳ profile nào
            // User chỉ có thể xem profile của chính mình
            if (!_currentUserService.IsAdmin && _currentUserService.UserId != userId)
            {
                return Forbid("Bạn chỉ có thể xem thông tin của chính mình");
            }

            var userProfile = await _authService.GetUserProfileAsync(userId);
            if (userProfile == null)
            {
                return NotFound("Không tìm thấy người dùng");
            }

            return Ok(new
            {
                success = true,
                data = userProfile,
                accessedBy = new
                {
                    userId = _currentUserService.UserId,
                    fullName = _currentUserService.FullName,
                    isAdmin = _currentUserService.IsAdmin
                }
            });
        }
    }
}
