using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class WarehouseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressDetail { get; set; } = string.Empty;
        public int ProvinceId { get; set; }
        public int DistrictId { get; set; }
        public int WardId { get; set; }
        public string ProvinceName { get; set; } = string.Empty;
        public string DistrictName { get; set; } = string.Empty;
        public string WardName { get; set; } = string.Empty;
        public int? GroupAddressId { get; set; }
        public bool IsRegistered { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateWarehouseDto
    {
        [Required(ErrorMessage = "Tên kho hàng là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên kho hàng không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string AddressDetail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        public int ProvinceId { get; set; }

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        public int DistrictId { get; set; }

        [Required(ErrorMessage = "Phường/Xã là bắt buộc")]
        public int WardId { get; set; }

        [StringLength(100)]
        public string ProvinceName { get; set; } = string.Empty;

        [StringLength(100)]
        public string DistrictName { get; set; } = string.Empty;

        [StringLength(100)]
        public string WardName { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateWarehouseDto
    {
        [Required(ErrorMessage = "Tên kho hàng là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên kho hàng không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết là bắt buộc")]
        [StringLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string AddressDetail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tỉnh/Thành phố là bắt buộc")]
        public int ProvinceId { get; set; }

        [Required(ErrorMessage = "Quận/Huyện là bắt buộc")]
        public int DistrictId { get; set; }

        [Required(ErrorMessage = "Phường/Xã là bắt buộc")]
        public int WardId { get; set; }

        [StringLength(100)]
        public string ProvinceName { get; set; } = string.Empty;

        [StringLength(100)]
        public string DistrictName { get; set; } = string.Empty;

        [StringLength(100)]
        public string WardName { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class WarehouseResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public WarehouseDto? Warehouse { get; set; }
        public List<WarehouseDto>? Warehouses { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
    }

    public class RegisterWarehouseRequest
    {
        [Required]
        public Guid WarehouseId { get; set; }
    }

    public class RegisterWarehouseResult
    {
        public bool IsSuccess { get; set; }
        public int? GroupAddressId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public int? ErrorCode { get; set; }
    }
}
