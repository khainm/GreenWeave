using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomBaseAngle
    {
        public int Id { get; set; }
        public int CustomBaseProductId { get; set; }
        [Required, MaxLength(50)] public string AngleKey { get; set; } = "front"; // front/left/right/back
        public int SortOrder { get; set; } = 0;

        public CustomBaseProduct Product { get; set; } = null!;
        public ICollection<CustomBaseLayer> Layers { get; set; } = new List<CustomBaseLayer>();
    }
}


