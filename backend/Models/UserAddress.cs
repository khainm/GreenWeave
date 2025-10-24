using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class UserAddress
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string AddressLine { get; set; } = string.Empty;


        [StringLength(100)]
        public string? Ward { get; set; } // Phường/Xã

        [Required]
        [StringLength(100)]
        public string District { get; set; } = string.Empty; // Quận/Huyện

        [Required]
        [StringLength(100)]
        public string Province { get; set; } = string.Empty; // Tỉnh/Thành phố

        // ✅ NEW: Store address IDs for shipping providers (ViettelPost, etc.)
        public int? ProvinceId { get; set; } // ViettelPost Province ID
        public int? DistrictId { get; set; } // ViettelPost District ID
        public int? WardId { get; set; } // ViettelPost Ward ID

        [StringLength(10)]
        public string? PostalCode { get; set; } // Mã bưu điện

        [StringLength(20)]
        public string AddressType { get; set; } = "Home"; // Home, Office, Other

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}
