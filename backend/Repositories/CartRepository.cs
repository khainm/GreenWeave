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

        public async Task<CartItem> AddItemAsync(Guid cartId, CartItem item)
        {
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


