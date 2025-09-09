using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomBaseLayer
    {
        public int Id { get; set; }
        public int CustomBaseAngleId { get; set; }
        [Required, MaxLength(50)] public string LayerType { get; set; } = "color"; // color/pattern/overlay/text/image
        public int ZIndex { get; set; } = 0;
        // Bounding region for customization
        public int X { get; set; } = 0;
        public int Y { get; set; } = 0;
        public int Width { get; set; } = 0;
        public int Height { get; set; } = 0;
        public string? ConstraintsJson { get; set; }

        public CustomBaseAngle Angle { get; set; } = null!;
    }
}


