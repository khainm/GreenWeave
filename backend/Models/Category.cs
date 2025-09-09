using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty; // Unique

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "active";

        public int SortOrder { get; set; } = 0;

        // Visibility and customization flags
        public bool IsVisible { get; set; } = true;
        public bool IsCustomizable { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}


