using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface ICartService
    {
        Task<CartDto> CreateAsync();
        Task<CartDto?> GetAsync(Guid id);
        Task<CartDto?> AssignToUserAsync(Guid cartId, string userId);
        Task<CartDto?> GetUserCartAsync(string userId);
        Task<CartItemDto> AddItemAsync(Guid cartId, AddCartItemRequest request);
        Task<CartItemDto?> UpdateItemQuantityAsync(Guid cartId, int itemId, int quantity);
        Task<bool> RemoveItemAsync(Guid cartId, int itemId);
    }
}


