using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _repo;
        public CartService(ICartRepository repo) { _repo = repo; }

        public async Task<CartDto> CreateAsync()
        {
            var cart = await _repo.CreateAsync();
            return ToDto(cart);
        }

        public async Task<CartDto?> GetAsync(Guid id)
        {
            var cart = await _repo.GetAsync(id);
            return cart == null ? null : ToDto(cart);
        }

        public async Task<CartDto?> AssignToUserAsync(Guid cartId, string userId)
        {
            var cart = await _repo.AssignToUserAsync(cartId, userId);
            return cart == null ? null : ToDto(cart);
        }

        public async Task<CartDto?> GetUserCartAsync(string userId)
        {
            var cart = await _repo.GetUserCartAsync(userId);
            return cart == null ? null : ToDto(cart);
        }

        public async Task<CartItemDto> AddItemAsync(Guid cartId, AddCartItemRequest request)
        {
            var item = new CartItem
            {
                ProductId = request.ProductId,
                ColorCode = request.ColorCode,
                Quantity = request.Quantity,
                UnitPrice = request.UnitPrice
            };
            var saved = await _repo.AddItemAsync(cartId, item);
            return ToItemDto(saved);
        }

        public async Task<CartItemDto?> UpdateItemQuantityAsync(Guid cartId, int itemId, int quantity)
        {
            var saved = await _repo.UpdateItemQuantityAsync(cartId, itemId, quantity);
            return saved == null ? null : ToItemDto(saved);
        }

        public Task<bool> RemoveItemAsync(Guid cartId, int itemId) => _repo.RemoveItemAsync(cartId, itemId);

        private static CartDto ToDto(Cart cart) => new CartDto
        {
            Id = cart.Id,
            CreatedAt = cart.CreatedAt,
            UpdatedAt = cart.UpdatedAt,
            Items = cart.Items.Select(ToItemDto).ToList()
        };

        private static CartItemDto ToItemDto(CartItem i) => new CartItemDto
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ColorCode = i.ColorCode,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice
        };
    }
}


