using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _context.Users
                .Include(u => u.Addresses.Where(a => a.IsActive))
                .Include(u => u.Carts)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Addresses.Where(a => a.IsActive))
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByCustomerCodeAsync(string customerCode)
        {
            return await _context.Users
                .Include(u => u.Addresses.Where(a => a.IsActive))
                .FirstOrDefaultAsync(u => u.CustomerCode == customerCode);
        }

        public async Task<IEnumerable<User>> GetAllActiveUsersAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .Include(u => u.Addresses.Where(a => a.IsActive))
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<User> CreateAsync(User user)
        {
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            // Soft delete - chỉ set IsActive = false
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UserExistsAsync(string id)
        {
            return await _context.Users.AnyAsync(u => u.Id == id);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> CustomerCodeExistsAsync(string customerCode)
        {
            return await _context.Users.AnyAsync(u => u.CustomerCode == customerCode);
        }

        public async Task<bool> SetUserActiveStatusAsync(string id, bool isActive)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
