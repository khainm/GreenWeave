// 🎨 Custom Design Entity
// Senior Backend Engineer - Production Ready

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models;

namespace GreenWeave.Models
{
    public class CustomDesign
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string DesignJson { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PreviewUrl { get; set; }

        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "draft"; // draft, saved, finalized

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Product? Product { get; set; }
        public virtual ICollection<ConsultationRequest> ConsultationRequests { get; set; } = new List<ConsultationRequest>();

        // Computed properties
        [NotMapped]
        public int ElementCount 
        { 
            get 
            {
                try
                {
                    if (string.IsNullOrEmpty(DesignJson)) return 0;
                    var design = System.Text.Json.JsonSerializer.Deserialize<DesignData>(DesignJson);
                    return design?.Elements?.Count ?? 0;
                }
                catch
                {
                    return 0;
                }
            }
        }

        [NotMapped]
        public string ComplexityLevel
        {
            get
            {
                var count = ElementCount;
                return count switch
                {
                    <= 5 => "low",
                    <= 15 => "medium",
                    _ => "high"
                };
            }
        }

        // Design data structure for JSON parsing
        public class DesignData
        {
            public int ProductId { get; set; }
            public string? SelectedColorCode { get; set; }
            public List<DesignElement>? Elements { get; set; }
            public int CanvasWidth { get; set; }
            public int CanvasHeight { get; set; }
            public string? BackgroundImage { get; set; }
            public DesignMetadata? Metadata { get; set; }
        }

        public class DesignElement
        {
            public string Id { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty; // image, sticker, text
            public double X { get; set; }
            public double Y { get; set; }
            public double Width { get; set; }
            public double Height { get; set; }
            public double Rotation { get; set; }
            public double ScaleX { get; set; } = 1;
            public double ScaleY { get; set; } = 1;
            public string? Src { get; set; }
            public string? Text { get; set; }
            public int? FontSize { get; set; }
            public string? FontFamily { get; set; }
            public string? Fill { get; set; }
            public int ZIndex { get; set; }
            public DateTime CreatedAt { get; set; }
            public double? Opacity { get; set; } = 1;
            public bool? Visible { get; set; } = true;
        }

        public class DesignMetadata
        {
            public string Version { get; set; } = "1.0";
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
            public int TotalElements { get; set; }
        }
    }
}