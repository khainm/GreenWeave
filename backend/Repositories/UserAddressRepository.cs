using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class UserAddressRepository : IUserAddressRepository
    {
        private readonly ApplicationDbContext _context;

        public UserAddressRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserAddress>> GetAddressesByUserIdAsync(string userId)
        {
            return await _context.UserAddresses
                .Where(a => a.UserId == userId && a.IsActive)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserAddress?> GetAddressByIdAsync(Guid addressId, string userId)
        {
            return await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId && a.IsActive);
        }

        public async Task<UserAddress?> GetDefaultAddressAsync(string userId)
        {
            return await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault && a.IsActive);
        }

        public async Task<UserAddress> CreateAddressAsync(UserAddress address)
        {
            // If this is set as default, unset other default addresses
            if (address.IsDefault)
            {
                var existingDefaultAddresses = await _context.UserAddresses
                    .Where(a => a.UserId == address.UserId && a.IsDefault && a.IsActive)
                    .ToListAsync();

                foreach (var existingAddress in existingDefaultAddresses)
                {
                    existingAddress.IsDefault = false;
                    existingAddress.UpdatedAt = DateTime.UtcNow;
                }
            }

            address.CreatedAt = DateTime.UtcNow;
            address.UpdatedAt = DateTime.UtcNow;

            _context.UserAddresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<UserAddress> UpdateAddressAsync(UserAddress address)
        {
            // If this is set as default, unset other default addresses
            if (address.IsDefault)
            {
                var existingDefaultAddresses = await _context.UserAddresses
                    .Where(a => a.UserId == address.UserId && a.IsDefault && a.IsActive && a.Id != address.Id)
                    .ToListAsync();

                foreach (var existingAddress in existingDefaultAddresses)
                {
                    existingAddress.IsDefault = false;
                    existingAddress.UpdatedAt = DateTime.UtcNow;
                }
            }

            address.UpdatedAt = DateTime.UtcNow;
            _context.UserAddresses.Update(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<bool> DeleteAddressAsync(Guid addressId, string userId)
        {
            var address = await GetAddressByIdAsync(addressId, userId);
            if (address == null) return false;

            // Soft delete
            address.IsActive = false;
            address.UpdatedAt = DateTime.UtcNow;
            
            // If this was the default address, set another address as default
            if (address.IsDefault)
            {
                var nextAddress = await _context.UserAddresses
                    .Where(a => a.UserId == userId && a.IsActive && a.Id != addressId)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();

                if (nextAddress != null)
                {
                    nextAddress.IsDefault = true;
                    nextAddress.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetDefaultAddressAsync(Guid addressId, string userId)
        {
            var address = await GetAddressByIdAsync(addressId, userId);
            if (address == null) return false;

            // Unset all other default addresses for this user
            var existingDefaultAddresses = await _context.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault && a.IsActive && a.Id != addressId)
                .ToListAsync();

            foreach (var existingAddress in existingDefaultAddresses)
            {
                existingAddress.IsDefault = false;
                existingAddress.UpdatedAt = DateTime.UtcNow;
            }

            // Set this address as default
            address.IsDefault = true;
            address.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetAddressCountAsync(string userId)
        {
            return await _context.UserAddresses
                .CountAsync(a => a.UserId == userId && a.IsActive);
        }
    }
}
