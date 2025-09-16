using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AdminUsersController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Lấy danh sách tất cả người dùng (Admin only)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Lấy danh sách người dùng theo role (Admin only)
        /// </summary>
        [HttpGet("by-role/{role}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersByRole(string role)
        {
            var users = await _authService.GetUsersByRoleAsync(role);
            return Ok(users);
        }

        /// <summary>
        /// Lấy danh sách roles của user (Admin only)
        /// </summary>
        [HttpGet("{userId}/roles")]
        public async Task<ActionResult<List<string>>> GetUserRoles(string userId)
        {
            var roles = await _authService.GetUserRolesAsync(userId);
            return Ok(roles);
        }

        /// <summary>
        /// Tìm user theo customer code (Admin only)
        /// </summary>
        [HttpGet("customer-code/{customerCode}")]
        public async Task<ActionResult<UserDto>> GetUserByCustomerCode(string customerCode)
        {
            var user = await _authService.GetUserByCustomerCodeAsync(customerCode);
            if (user == null)
            {
                return NotFound("Không tìm thấy người dùng");
            }
            return Ok(user);
        }

        /// <summary>
        /// Tạo user mới với role (Admin only)
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<AuthResponseDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.CreateUserWithRoleAsync(createUserDto);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// Cập nhật role của user (Admin only)
        /// </summary>
        [HttpPut("{userId}/role")]
        public async Task<ActionResult<AuthResponseDto>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleDto updateRoleDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.UpdateUserRoleAsync(userId, updateRoleDto);
            
            if (result.Success)
            {
                return Ok(result);
            }
            
            return BadRequest(result);
        }

        /// <summary>
        /// Vô hiệu hóa user (Admin only)
        /// </summary>
        [HttpPut("{userId}/deactivate")]
        public async Task<ActionResult> DeactivateUser(string userId)
        {
            var result = await _authService.DeactivateUserAsync(userId);
            
            if (result)
            {
                return Ok(new { Message = "Vô hiệu hóa người dùng thành công" });
            }
            
            return BadRequest(new { Message = "Vô hiệu hóa người dùng thất bại" });
        }

        /// <summary>
        /// Kích hoạt lại user (Admin only)
        /// </summary>
        [HttpPut("{userId}/activate")]
        public async Task<ActionResult> ActivateUser(string userId)
        {
            var result = await _authService.ActivateUserAsync(userId);
            
            if (result)
            {
                return Ok(new { Message = "Kích hoạt người dùng thành công" });
            }
            
            return BadRequest(new { Message = "Kích hoạt người dùng thất bại" });
        }
    }
}
