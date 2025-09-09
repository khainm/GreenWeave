using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "active";
        public int SortOrder { get; set; }
        public int ProductCount { get; set; }
        public bool IsVisible { get; set; }
        public bool IsCustomizable { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [RegularExpression("^(active|inactive)$")]
        public string Status { get; set; } = "active";

        public int SortOrder { get; set; } = 0;
        // Optional flags from admin; default if omitted
        public bool? IsVisible { get; set; }
        public bool? IsCustomizable { get; set; }
    }
}


