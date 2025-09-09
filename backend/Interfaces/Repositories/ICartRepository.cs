using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface ICartRepository
    {
        Task<Cart> CreateAsync();
        Task<Cart?> GetAsync(Guid id);
        Task<CartItem> AddItemAsync(Guid cartId, CartItem item);
        Task<CartItem?> UpdateItemQuantityAsync(Guid cartId, int itemId, int quantity);
        Task<bool> RemoveItemAsync(Guid cartId, int itemId);
    }
}


