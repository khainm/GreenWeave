using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class BlogLike
    {
        public int Id { get; set; }
        
        [Required]
        public int BlogId { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public DateTime LikedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("BlogId")]
        public virtual Blog Blog { get; set; } = null!;
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        // Composite unique constraint will be handled in DbContext
    }
}
