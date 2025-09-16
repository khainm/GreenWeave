using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IUserAddressRepository
    {
        Task<IEnumerable<UserAddress>> GetAddressesByUserIdAsync(string userId);
        Task<UserAddress?> GetAddressByIdAsync(Guid addressId, string userId);
        Task<UserAddress?> GetDefaultAddressAsync(string userId);
        Task<UserAddress> CreateAddressAsync(UserAddress address);
        Task<UserAddress> UpdateAddressAsync(UserAddress address);
        Task<bool> DeleteAddressAsync(Guid addressId, string userId);
        Task<bool> SetDefaultAddressAsync(Guid addressId, string userId);
        Task<int> GetAddressCountAsync(string userId);
    }
}
