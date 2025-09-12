using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class UserAddressDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public string? Ward { get; set; }
        public string District { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public string AddressType { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUserAddressDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string AddressLine { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Phường/Xã không được vượt quá 100 ký tự")]
        public string? Ward { get; set; }

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        [StringLength(100, ErrorMessage = "Quận/Huyện không được vượt quá 100 ký tự")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tỉnh/Thành phố không được vượt quá 100 ký tự")]
        public string Province { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "Mã bưu điện không được vượt quá 10 ký tự")]
        public string? PostalCode { get; set; }

        [Required(ErrorMessage = "Loại địa chỉ là bắt buộc")]
        public string AddressType { get; set; } = "Home"; // Home, Office, Other

        public bool IsDefault { get; set; } = false;
    }

    public class UpdateUserAddressDto
    {
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string AddressLine { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Phường/Xã không được vượt quá 100 ký tự")]
        public string? Ward { get; set; }

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        [StringLength(100, ErrorMessage = "Quận/Huyện không được vượt quá 100 ký tự")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tỉnh/Thành phố không được vượt quá 100 ký tự")]
        public string Province { get; set; } = string.Empty;

        [StringLength(10, ErrorMessage = "Mã bưu điện không được vượt quá 10 ký tự")]
        public string? PostalCode { get; set; }

        [Required(ErrorMessage = "Loại địa chỉ là bắt buộc")]
        public string AddressType { get; set; } = "Home";

        public bool IsDefault { get; set; } = false;
    }

    public class UserAddressResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public UserAddressDto? Address { get; set; }
        public List<UserAddressDto>? Addresses { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }
}
