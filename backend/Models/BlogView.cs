using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class BlogView
    {
        public int Id { get; set; }
        
        [Required]
        public int BlogId { get; set; }
        
        [Required]
        [MaxLength(45)] // IPv4: 15 chars, IPv6: 39 chars
        public string IpAddress { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? UserAgent { get; set; }
        
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("BlogId")]
        public virtual Blog Blog { get; set; } = null!;
    }
}
