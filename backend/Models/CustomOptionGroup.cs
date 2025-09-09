using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomOptionGroup
    {
        public int Id { get; set; }
        public int CustomBaseProductId { get; set; }
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
        public bool Required { get; set; } = false;
        public bool MultiSelect { get; set; } = false;
        public int? SelectionLimit { get; set; }

        public CustomBaseProduct Product { get; set; } = null!;
        public ICollection<CustomOption> Options { get; set; } = new List<CustomOption>();
    }
}


