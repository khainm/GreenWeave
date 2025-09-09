using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class CustomDesign
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public int CustomBaseProductId { get; set; }
        public decimal SnapshotPrice { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string PayloadJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CustomBaseProduct BaseProduct { get; set; } = null!;
    }
}


