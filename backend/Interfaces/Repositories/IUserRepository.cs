using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(string id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByCustomerCodeAsync(string customerCode);
        Task<IEnumerable<User>> GetAllActiveUsersAsync();
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(string id);
        Task<bool> UserExistsAsync(string id);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> CustomerCodeExistsAsync(string customerCode);
        Task<bool> SetUserActiveStatusAsync(string id, bool isActive);
    }
}
