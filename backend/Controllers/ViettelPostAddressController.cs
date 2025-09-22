using backend.DTOs;
using backend.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// Controller for Viettel Post address APIs
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ViettelPostAddressController : ControllerBase
    {
        private readonly IViettelPostAddressService _addressService;
        private readonly ILogger<ViettelPostAddressController> _logger;

        public ViettelPostAddressController(
            IViettelPostAddressService addressService,
            ILogger<ViettelPostAddressController> logger)
        {
            _addressService = addressService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tỉnh/thành phố từ Viettel Post
        /// </summary>
        /// <returns>Danh sách tỉnh/thành phố</returns>
        [HttpGet("provinces")]
        [AllowAnonymous]
        public async Task<ActionResult<AddressApiResponse<List<AddressDto>>>> GetProvinces()
        {
            try
            {
                var result = await _addressService.GetProvincesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provinces");
                return StatusCode(500, new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách tỉnh/thành phố",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách quận/huyện theo tỉnh từ Viettel Post
        /// </summary>
        /// <param name="provinceId">ID của tỉnh/thành phố</param>
        /// <returns>Danh sách quận/huyện</returns>
        [HttpGet("districts")]
         [AllowAnonymous]
        public async Task<ActionResult<AddressApiResponse<List<AddressDto>>>> GetDistricts([FromQuery] int provinceId)
        {
            try
            {
                if (provinceId <= 0)
                {
                    return BadRequest(new AddressApiResponse<List<AddressDto>>
                    {
                        Success = false,
                        Message = "ID tỉnh/thành phố không hợp lệ",
                        Errors = new List<string> { "Province ID must be greater than 0" }
                    });
                }

                var result = await _addressService.GetDistrictsAsync(provinceId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting districts for province {ProvinceId}", provinceId);
                return StatusCode(500, new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách quận/huyện",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy danh sách phường/xã theo quận/huyện từ Viettel Post
        /// </summary>
        /// <param name="districtId">ID của quận/huyện</param>
        /// <returns>Danh sách phường/xã</returns>
        [HttpGet("wards")]
         [AllowAnonymous]
        public async Task<ActionResult<AddressApiResponse<List<AddressDto>>>> GetWards([FromQuery] int districtId)
        {
            try
            {
                if (districtId <= 0)
                {
                    return BadRequest(new AddressApiResponse<List<AddressDto>>
                    {
                        Success = false,
                        Message = "ID quận/huyện không hợp lệ",
                        Errors = new List<string> { "District ID must be greater than 0" }
                    });
                }

                var result = await _addressService.GetWardsAsync(districtId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting wards for district {DistrictId}", districtId);
                return StatusCode(500, new AddressApiResponse<List<AddressDto>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách phường/xã",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Lấy thông tin tỉnh/thành phố với tất cả quận/huyện và phường/xã
        /// </summary>
        /// <param name="provinceId">ID của tỉnh/thành phố</param>
        /// <returns>Thông tin tỉnh/thành phố với quận/huyện và phường/xã</returns>
        [HttpGet("province-with-districts")]
         [AllowAnonymous]
        public async Task<ActionResult<AddressApiResponse<ProvinceWithDistrictsDto>>> GetProvinceWithDistricts([FromQuery] int provinceId)
        {
            try
            {
                if (provinceId <= 0)
                {
                    return BadRequest(new AddressApiResponse<ProvinceWithDistrictsDto>
                    {
                        Success = false,
                        Message = "ID tỉnh/thành phố không hợp lệ",
                        Errors = new List<string> { "Province ID must be greater than 0" }
                    });
                }

                var result = await _addressService.GetProvinceWithDistrictsAsync(provinceId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting province with districts for province {ProvinceId}", provinceId);
                return StatusCode(500, new AddressApiResponse<ProvinceWithDistrictsDto>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy thông tin tỉnh/thành phố",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Kiểm tra địa chỉ có cảnh báo không
        /// </summary>
        /// <param name="wardId">ID của phường/xã</param>
        /// <returns>Kết quả kiểm tra địa chỉ</returns>
        [HttpGet("check-address-warning")]
         [AllowAnonymous]
        public async Task<ActionResult<AddressWarningResult>> CheckAddressWarning([FromQuery] int wardId)
        {
            try
            {
                if (wardId <= 0)
                {
                    return BadRequest(new AddressWarningResult
                    {
                        HasWarning = false,
                        WarningMessage = "ID phường/xã không hợp lệ",
                        IsValid = false
                    });
                }

                var result = await _addressService.CheckAddressWarningAsync(wardId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking address warning for ward {WardId}", wardId);
                return StatusCode(500, new AddressWarningResult
                {
                    HasWarning = false,
                    WarningMessage = "Đã xảy ra lỗi khi kiểm tra địa chỉ",
                    IsValid = false
                });
            }
        }
    }
}
