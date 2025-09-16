using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly ApplicationDbContext _db;
        public CartRepository(ApplicationDbContext db) { _db = db; }

        public async Task<Cart> CreateAsync()
        {
            var cart = new Cart();
            _db.Set<Cart>().Add(cart);
            await _db.SaveChangesAsync();
            return cart;
        }

        public async Task<Cart?> GetAsync(Guid id)
        {
            return await _db.Set<Cart>()
                .Include(c => c.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Cart?> AssignToUserAsync(Guid cartId, string userId)
        {
            var cart = await _db.Set<Cart>().FirstOrDefaultAsync(c => c.Id == cartId);
            if (cart == null) return null;
            
            cart.UserId = userId;
            cart.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            
            return await GetAsync(cartId);
        }

        public async Task<Cart?> GetUserCartAsync(string userId)
        {
            return await _db.Set<Cart>()
                .Include(c => c.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<CartItem> AddItemAsync(Guid cartId, CartItem item)
        {
            // Check if cart exists first
            var cartExists = await _db.Set<Cart>().AnyAsync(c => c.Id == cartId);
            if (!cartExists)
            {
                throw new ArgumentException("Không tìm thấy giỏ hàng", nameof(cartId));
            }

            item.CartId = cartId;
            _db.Set<CartItem>().Add(item);
            await _db.SaveChangesAsync();
            return item;
        }

        public async Task<CartItem?> UpdateItemQuantityAsync(Guid cartId, int itemId, int quantity)
        {
            var item = await _db.Set<CartItem>().FirstOrDefaultAsync(i => i.Id == itemId && i.CartId == cartId);
            if (item == null) return null;
            item.Quantity = quantity;
            await _db.SaveChangesAsync();
            return item;
        }

        public async Task<bool> RemoveItemAsync(Guid cartId, int itemId)
        {
            var item = await _db.Set<CartItem>().FirstOrDefaultAsync(i => i.Id == itemId && i.CartId == cartId);
            if (item == null) return false;
            _db.Set<CartItem>().Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}


