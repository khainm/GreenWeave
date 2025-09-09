using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomOption
    {
        public int Id { get; set; }
        public int CustomOptionGroupId { get; set; }
        [Required, MaxLength(50)] public string Code { get; set; } = string.Empty;
        [Required, MaxLength(100)] public string DisplayName { get; set; } = string.Empty;
        public decimal ExtraPrice { get; set; } = 0m;
        public string? AssetRef { get; set; } // link ảnh/pattern
        public string? MetaJson { get; set; } // ví dụ: { "colorCode": "#10b981" }

        public CustomOptionGroup Group { get; set; } = null!;
    }
}


