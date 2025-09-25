using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class PasswordResetToken
    {
        public Guid Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        public DateTime ExpiryDate { get; set; } = DateTime.UtcNow.AddHours(1); // Token expires in 1 hour

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UsedAt { get; set; } // To mark token as used

        public bool IsUsed => UsedAt.HasValue;

        public bool IsExpired => ExpiryDate < DateTime.UtcNow;

        // Navigation property
        public virtual User User { get; set; } = default!;
    }
}
