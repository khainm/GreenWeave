using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Warehouse
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string AddressDetail { get; set; } = string.Empty;

        [Required]
        public int ProvinceId { get; set; }

        [Required]
        public int DistrictId { get; set; }

        [Required]
        public int WardId { get; set; }

        [StringLength(100)]
        public string ProvinceName { get; set; } = string.Empty;

        [StringLength(100)]
        public string DistrictName { get; set; } = string.Empty;

        [StringLength(100)]
        public string WardName { get; set; } = string.Empty;

        public int? GroupAddressId { get; set; }

        public bool IsRegistered { get; set; } = false;

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string? Notes { get; set; }
    }
}
