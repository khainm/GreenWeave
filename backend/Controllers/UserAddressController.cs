using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserAddressController : ControllerBase
    {
        private readonly IUserAddressService _userAddressService;

        public UserAddressController(IUserAddressService userAddressService)
        {
            _userAddressService = userAddressService;
        }

        /// <summary>
        /// Lấy danh sách địa chỉ của người dùng
        /// </summary>
        /// <returns>Danh sách địa chỉ</returns>
        [HttpGet]
        public async Task<ActionResult<UserAddressResponseDto>> GetAddresses()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var result = await _userAddressService.GetAddressesAsync(userId);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin địa chỉ theo ID
        /// </summary>
        /// <param name="id">ID của địa chỉ</param>
        /// <returns>Thông tin địa chỉ</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserAddressResponseDto>> GetAddress(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var result = await _userAddressService.GetAddressByIdAsync(id, userId);
            
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Lấy địa chỉ mặc định của người dùng
        /// </summary>
        /// <returns>Địa chỉ mặc định</returns>
        [HttpGet("default")]
        public async Task<ActionResult<UserAddressDto>> GetDefaultAddress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var address = await _userAddressService.GetDefaultAddressAsync(userId);
            
            if (address == null)
            {
                return NotFound(new { message = "Không tìm thấy địa chỉ mặc định" });
            }

            return Ok(address);
        }

        /// <summary>
        /// Tạo địa chỉ mới
        /// </summary>
        /// <param name="createAddressDto">Thông tin địa chỉ mới</param>
        /// <returns>Thông tin địa chỉ đã tạo</returns>
        [HttpPost]
        public async Task<ActionResult<UserAddressResponseDto>> CreateAddress([FromBody] CreateUserAddressDto createAddressDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu địa chỉ không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _userAddressService.CreateAddressAsync(userId, createAddressDto);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetAddress), new { id = result.Address!.Id }, result);
        }

        /// <summary>
        /// Cập nhật thông tin địa chỉ
        /// </summary>
        /// <param name="id">ID của địa chỉ</param>
        /// <param name="updateAddressDto">Thông tin cập nhật</param>
        /// <returns>Thông tin địa chỉ đã cập nhật</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<UserAddressResponseDto>> UpdateAddress(Guid id, [FromBody] UpdateUserAddressDto updateAddressDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Dữ liệu cập nhật không hợp lệ",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _userAddressService.UpdateAddressAsync(id, userId, updateAddressDto);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Xóa địa chỉ
        /// </summary>
        /// <param name="id">ID của địa chỉ</param>
        /// <returns>Kết quả xóa</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<UserAddressResponseDto>> DeleteAddress(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _userAddressService.DeleteAddressAsync(id, userId);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Đặt địa chỉ làm mặc định
        /// </summary>
        /// <param name="id">ID của địa chỉ</param>
        /// <returns>Kết quả đặt mặc định</returns>
        [HttpPost("{id}/set-default")]
        public async Task<ActionResult<UserAddressResponseDto>> SetDefaultAddress(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Không thể xác định người dùng"
                });
            }

            var result = await _userAddressService.SetDefaultAddressAsync(id, userId);
            
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
