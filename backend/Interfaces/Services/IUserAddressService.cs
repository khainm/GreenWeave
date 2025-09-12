using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IUserAddressService
    {
        Task<UserAddressResponseDto> GetAddressesAsync(string userId);
        Task<UserAddressResponseDto> GetAddressByIdAsync(Guid addressId, string userId);
        Task<UserAddressResponseDto> CreateAddressAsync(string userId, CreateUserAddressDto createAddressDto);
        Task<UserAddressResponseDto> UpdateAddressAsync(Guid addressId, string userId, UpdateUserAddressDto updateAddressDto);
        Task<UserAddressResponseDto> DeleteAddressAsync(Guid addressId, string userId);
        Task<UserAddressResponseDto> SetDefaultAddressAsync(Guid addressId, string userId);
        Task<UserAddressDto?> GetDefaultAddressAsync(string userId);
    }
}
