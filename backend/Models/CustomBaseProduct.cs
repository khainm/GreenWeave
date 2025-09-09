using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomBaseProduct
    {
        public int Id { get; set; }
        [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
        [MaxLength(1000)] public string? Description { get; set; }
        public int CategoryId { get; set; }
        public decimal BasePrice { get; set; }
        [MaxLength(20)] public string Status { get; set; } = "active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Category? Category { get; set; }
        public ICollection<CustomBaseAngle> Angles { get; set; } = new List<CustomBaseAngle>();
        public ICollection<CustomOptionGroup> OptionGroups { get; set; } = new List<CustomOptionGroup>();
    }
}


