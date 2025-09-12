using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IAuthService
    {
        // Authentication operations (cần UserManager)
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
        
        // Profile operations (có thể dùng Repository)
        Task<UserDto?> GetUserProfileAsync(string userId);
        Task<AuthResponseDto> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto);
        Task<AuthResponseDto> UploadAvatarAsync(string userId, IFormFile avatarFile);
        
        // Admin operations (nên dùng Repository)
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByCustomerCodeAsync(string customerCode);
        Task<bool> DeactivateUserAsync(string userId);
        
        // Role management operations
        Task<AuthResponseDto> CreateUserWithRoleAsync(CreateUserDto createUserDto);
        Task<AuthResponseDto> UpdateUserRoleAsync(string userId, UpdateUserRoleDto updateRoleDto);
        Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role);
        Task<List<string>> GetUserRolesAsync(string userId);
    }
}
