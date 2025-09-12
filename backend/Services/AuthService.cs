using backend.DTOs;
using backend.Interfaces.Services;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IJwtService _jwtService;
        private readonly ICustomerCodeService _customerCodeService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUserRepository _userRepository;
        private readonly IUserAddressService _userAddressService;

        // Logic sử dụng:
        // - UserManager: Authentication operations (register, login, password, identity operations)
        // - Repository: Pure data operations (get, query, soft delete)

        public AuthService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IJwtService jwtService,
            ICustomerCodeService customerCodeService,
            ICloudinaryService cloudinaryService,
            IUserRepository userRepository,
            IUserAddressService userAddressService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
            _customerCodeService = customerCodeService;
            _cloudinaryService = cloudinaryService;
            _userRepository = userRepository;
            _userAddressService = userAddressService;
        }

        // Helper method để tạo UserDto
        private async Task<UserDto> CreateUserDtoAsync(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return new UserDto
            {
                Id = user.Id,
                CustomerCode = user.CustomerCode,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                Avatar = user.Avatar,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
                Roles = roles.ToList()
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists using UserManager (bảo mật hơn)
                var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
                if (existingUser != null)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Email đã được sử dụng",
                        Errors = new List<string> { "Email đã tồn tại trong hệ thống" }
                    };
                }

                // Generate customer code
                var customerCode = await _customerCodeService.GenerateCustomerCodeAsync();

                // Create new user
                var user = new User
                {
                    UserName = registerDto.Email,
                    Email = registerDto.Email,
                    CustomerCode = customerCode,
                    FullName = registerDto.FullName,
                    PhoneNumber = registerDto.PhoneNumber,
                    DateOfBirth = registerDto.DateOfBirth,
                    Address = registerDto.Address,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await _userManager.CreateAsync(user, registerDto.Password);

                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Đăng ký thất bại",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                // Assign Customer role by default
                await _userManager.AddToRoleAsync(user, UserRoles.Customer);

                // Tự động tạo UserAddress từ địa chỉ đăng ký nếu có
                if (!string.IsNullOrWhiteSpace(registerDto.Address))
                {
                    var createAddressDto = new CreateUserAddressDto
                    {
                        FullName = registerDto.FullName,
                        PhoneNumber = registerDto.PhoneNumber ?? string.Empty,
                        AddressType = "Home", // Mặc định
                        AddressLine = registerDto.Address,
                        Ward = "", // Để trống vì không có thông tin chi tiết
                        District = "Chưa xác định",
                        Province = "Chưa xác định",
                        PostalCode = null,
                        IsDefault = true // Đặt làm địa chỉ mặc định
                    };

                    // Tạo địa chỉ nhưng không làm ảnh hưởng đến quá trình đăng ký nếu lỗi
                    try
                    {
                        await _userAddressService.CreateAddressAsync(user.Id, createAddressDto);
                    }
                    catch
                    {
                        // Log lỗi nhưng không return error để không ảnh hưởng đến việc đăng ký
                        // Có thể log: Không thể tạo địa chỉ tự động cho user
                    }
                }

                // Generate JWT token with roles
                var roles = await _userManager.GetRolesAsync(user);
                var token = _jwtService.GenerateToken(user, roles);

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Đăng ký thành công",
                    Token = token,
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình đăng ký",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(loginDto.Email);
                if (user == null || !user.IsActive)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Email hoặc mật khẩu không đúng",
                        Errors = new List<string> { "Thông tin đăng nhập không hợp lệ" }
                    };
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
                
                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Email hoặc mật khẩu không đúng",
                        Errors = new List<string> { "Thông tin đăng nhập không hợp lệ" }
                    };
                }

                // Generate JWT token with roles
                var roles = await _userManager.GetRolesAsync(user);
                var token = _jwtService.GenerateToken(user, roles);

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Đăng nhập thành công",
                    Token = token,
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình đăng nhập",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<UserDto?> GetUserProfileAsync(string userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
                return null;

            return await CreateUserDtoAsync(user);
        }

        public async Task<AuthResponseDto> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        Errors = new List<string> { "Người dùng không tồn tại hoặc đã bị vô hiệu hóa" }
                    };
                }

                user.FullName = updateProfileDto.FullName;
                user.PhoneNumber = updateProfileDto.PhoneNumber;
                user.DateOfBirth = updateProfileDto.DateOfBirth;
                user.Address = updateProfileDto.Address;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Cập nhật thông tin thất bại",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Cập nhật thông tin thành công",
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình cập nhật",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AuthResponseDto> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        Errors = new List<string> { "Người dùng không tồn tại hoặc đã bị vô hiệu hóa" }
                    };
                }

                var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Đổi mật khẩu thất bại",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Đổi mật khẩu thành công"
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình đổi mật khẩu",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AuthResponseDto> UploadAvatarAsync(string userId, IFormFile avatarFile)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        Errors = new List<string> { "Người dùng không tồn tại hoặc đã bị vô hiệu hóa" }
                    };
                }

                // Upload to Cloudinary
                var uploadResult = await _cloudinaryService.UploadImageAsync(avatarFile, "avatars");
                
                if (uploadResult.Error != null)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Upload avatar thất bại",
                        Errors = new List<string> { uploadResult.Error.Message }
                    };
                }

                // Delete old avatar if exists
                if (!string.IsNullOrEmpty(user.Avatar))
                {
                    await _cloudinaryService.DeleteImageAsync(user.Avatar);
                }

                user.Avatar = uploadResult.SecureUrl.ToString();
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Cập nhật avatar thất bại",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Cập nhật avatar thành công",
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình upload avatar",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        // Admin operations - sử dụng Repository
        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAllActiveUsersAsync();
                var userDtos = new List<UserDto>();
                
                foreach (var user in users)
                {
                    userDtos.Add(await CreateUserDtoAsync(user));
                }
                
                return userDtos;
            }
            catch (Exception)
            {
                return new List<UserDto>();
            }
        }

        public async Task<UserDto?> GetUserByCustomerCodeAsync(string customerCode)
        {
            try
            {
                var user = await _userRepository.GetByCustomerCodeAsync(customerCode);
                if (user == null || !user.IsActive)
                    return null;

                return await CreateUserDtoAsync(user);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<bool> DeactivateUserAsync(string userId)
        {
            try
            {
                return await _userRepository.SetUserActiveStatusAsync(userId, false);
            }
            catch (Exception)
            {
                return false;
            }
        }

        // Role management operations
        public async Task<AuthResponseDto> CreateUserWithRoleAsync(CreateUserDto createUserDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(createUserDto.Email);
                if (existingUser != null)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Email đã được sử dụng",
                        Errors = new List<string> { "Email đã tồn tại trong hệ thống" }
                    };
                }

                // Validate role
                if (!UserRoles.AllRoles.Contains(createUserDto.Role))
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Role không hợp lệ",
                        Errors = new List<string> { "Role phải là Admin, Staff hoặc Customer" }
                    };
                }

                // Generate customer code
                var customerCode = await _customerCodeService.GenerateCustomerCodeAsync();

                // Create new user
                var user = new User
                {
                    UserName = createUserDto.Email,
                    Email = createUserDto.Email,
                    CustomerCode = customerCode,
                    FullName = createUserDto.FullName,
                    PhoneNumber = createUserDto.PhoneNumber,
                    DateOfBirth = createUserDto.DateOfBirth,
                    Address = createUserDto.Address,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await _userManager.CreateAsync(user, createUserDto.Password);

                if (!result.Succeeded)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Tạo user thất bại",
                        Errors = result.Errors.Select(e => e.Description).ToList()
                    };
                }

                // Assign role
                await _userManager.AddToRoleAsync(user, createUserDto.Role);

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Tạo user thành công",
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình tạo user",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<AuthResponseDto> UpdateUserRoleAsync(string userId, UpdateUserRoleDto updateRoleDto)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        Errors = new List<string> { "Người dùng không tồn tại hoặc đã bị vô hiệu hóa" }
                    };
                }

                // Validate role
                if (!UserRoles.AllRoles.Contains(updateRoleDto.Role))
                {
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Role không hợp lệ",
                        Errors = new List<string> { "Role phải là Admin, Staff hoặc Customer" }
                    };
                }

                // Remove current roles
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (currentRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                }

                // Add new role
                await _userManager.AddToRoleAsync(user, updateRoleDto.Role);

                user.UpdatedAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Cập nhật role thành công",
                    User = await CreateUserDtoAsync(user)
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi trong quá trình cập nhật role",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<IEnumerable<UserDto>> GetUsersByRoleAsync(string role)
        {
            try
            {
                if (!UserRoles.AllRoles.Contains(role))
                {
                    return new List<UserDto>();
                }

                var usersInRole = await _userManager.GetUsersInRoleAsync(role);
                var activeUsers = usersInRole.Where(u => u.IsActive);
                var userDtos = new List<UserDto>();

                foreach (var user in activeUsers)
                {
                    userDtos.Add(await CreateUserDtoAsync(user));
                }

                return userDtos;
            }
            catch (Exception)
            {
                return new List<UserDto>();
            }
        }

        public async Task<List<string>> GetUserRolesAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new List<string>();
                }

                var roles = await _userManager.GetRolesAsync(user);
                return roles.ToList();
            }
            catch (Exception)
            {
                return new List<string>();
            }
        }
    }
}
