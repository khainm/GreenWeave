using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class UserAddressService : IUserAddressService
    {
        private readonly IUserAddressRepository _addressRepository;
        private const int MAX_ADDRESSES_PER_USER = 10;

        public UserAddressService(IUserAddressRepository addressRepository)
        {
            _addressRepository = addressRepository;
        }

        public async Task<UserAddressResponseDto> GetAddressesAsync(string userId)
        {
            try
            {
                var addresses = await _addressRepository.GetAddressesByUserIdAsync(userId);
                var addressDtos = addresses.Select(MapToDto).ToList();

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Lấy danh sách địa chỉ thành công",
                    Addresses = addressDtos
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách địa chỉ",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressResponseDto> GetAddressByIdAsync(Guid addressId, string userId)
        {
            try
            {
                var address = await _addressRepository.GetAddressByIdAsync(addressId, userId);
                if (address == null)
                {
                    return new UserAddressResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy địa chỉ",
                        Errors = new List<string> { "Địa chỉ không tồn tại hoặc bạn không có quyền truy cập" }
                    };
                }

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Lấy thông tin địa chỉ thành công",
                    Address = MapToDto(address)
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy thông tin địa chỉ",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressResponseDto> CreateAddressAsync(string userId, CreateUserAddressDto createAddressDto)
        {
            try
            {
                // Check if user has reached the maximum number of addresses
                var addressCount = await _addressRepository.GetAddressCountAsync(userId);
                if (addressCount >= MAX_ADDRESSES_PER_USER)
                {
                    return new UserAddressResponseDto
                    {
                        Success = false,
                        Message = "Đã đạt giới hạn số lượng địa chỉ",
                        Errors = new List<string> { $"Bạn chỉ có thể tạo tối đa {MAX_ADDRESSES_PER_USER} địa chỉ" }
                    };
                }

                // If this is the first address, set it as default
                if (addressCount == 0)
                {
                    createAddressDto.IsDefault = true;
                }

                var address = new UserAddress
                {
                    UserId = userId,
                    FullName = createAddressDto.FullName,
                    PhoneNumber = createAddressDto.PhoneNumber,
                    AddressLine = createAddressDto.AddressLine,
                    Ward = createAddressDto.Ward,
                    District = createAddressDto.District,
                    Province = createAddressDto.Province,
                    ProvinceId = createAddressDto.ProvinceId,
                    DistrictId = createAddressDto.DistrictId,
                    WardId = createAddressDto.WardId,
                    PostalCode = createAddressDto.PostalCode,
                    AddressType = createAddressDto.AddressType,
                    IsDefault = createAddressDto.IsDefault,
                    IsActive = true
                };

                var createdAddress = await _addressRepository.CreateAddressAsync(address);

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Tạo địa chỉ thành công",
                    Address = MapToDto(createdAddress)
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi tạo địa chỉ",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressResponseDto> UpdateAddressAsync(Guid addressId, string userId, UpdateUserAddressDto updateAddressDto)
        {
            try
            {
                var existingAddress = await _addressRepository.GetAddressByIdAsync(addressId, userId);
                if (existingAddress == null)
                {
                    return new UserAddressResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy địa chỉ",
                        Errors = new List<string> { "Địa chỉ không tồn tại hoặc bạn không có quyền truy cập" }
                    };
                }

                existingAddress.FullName = updateAddressDto.FullName;
                existingAddress.PhoneNumber = updateAddressDto.PhoneNumber;
                existingAddress.AddressLine = updateAddressDto.AddressLine;
                existingAddress.Ward = updateAddressDto.Ward;
                existingAddress.District = updateAddressDto.District;
                existingAddress.Province = updateAddressDto.Province;
                existingAddress.ProvinceId = updateAddressDto.ProvinceId;
                existingAddress.DistrictId = updateAddressDto.DistrictId;
                existingAddress.WardId = updateAddressDto.WardId;
                existingAddress.PostalCode = updateAddressDto.PostalCode;
                existingAddress.AddressType = updateAddressDto.AddressType;
                existingAddress.IsDefault = updateAddressDto.IsDefault;

                var updatedAddress = await _addressRepository.UpdateAddressAsync(existingAddress);

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Cập nhật địa chỉ thành công",
                    Address = MapToDto(updatedAddress)
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật địa chỉ",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressResponseDto> DeleteAddressAsync(Guid addressId, string userId)
        {
            try
            {
                var success = await _addressRepository.DeleteAddressAsync(addressId, userId);
                if (!success)
                {
                    return new UserAddressResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy địa chỉ",
                        Errors = new List<string> { "Địa chỉ không tồn tại hoặc bạn không có quyền truy cập" }
                    };
                }

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Xóa địa chỉ thành công"
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xóa địa chỉ",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressResponseDto> SetDefaultAddressAsync(Guid addressId, string userId)
        {
            try
            {
                var success = await _addressRepository.SetDefaultAddressAsync(addressId, userId);
                if (!success)
                {
                    return new UserAddressResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy địa chỉ",
                        Errors = new List<string> { "Địa chỉ không tồn tại hoặc bạn không có quyền truy cập" }
                    };
                }

                return new UserAddressResponseDto
                {
                    Success = true,
                    Message = "Đặt địa chỉ mặc định thành công"
                };
            }
            catch (Exception ex)
            {
                return new UserAddressResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đặt địa chỉ mặc định",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserAddressDto?> GetDefaultAddressAsync(string userId)
        {
            try
            {
                var address = await _addressRepository.GetDefaultAddressAsync(userId);
                return address != null ? MapToDto(address) : null;
            }
            catch
            {
                return null;
            }
        }

        private static UserAddressDto MapToDto(UserAddress address)
        {
            return new UserAddressDto
            {
                Id = address.Id,
                FullName = address.FullName,
                PhoneNumber = address.PhoneNumber,
                AddressLine = address.AddressLine,
                Ward = address.Ward,
                District = address.District,
                Province = address.Province,
                ProvinceId = address.ProvinceId,
                DistrictId = address.DistrictId,
                WardId = address.WardId,
                PostalCode = address.PostalCode,
                AddressType = address.AddressType,
                IsDefault = address.IsDefault,
                IsActive = address.IsActive,
                CreatedAt = address.CreatedAt
            };
        }
    }
}
