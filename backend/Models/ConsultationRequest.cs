// 📞 Consultation Request Entity
// Senior Backend Engineer - Production Ready

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using backend.Models;

namespace GreenWeave.Models
{
    public class ConsultationRequest
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? DesignId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string PreferredContact { get; set; } = string.Empty; // phone, zalo, facebook

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Zalo { get; set; }

        [StringLength(200)]
        public string? Facebook { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? ProductName { get; set; }

        // ✅ Support base64 image strings (can be very long, ~50KB-200KB)
        // Using MaxLength instead of StringLength to avoid validation issues
        [MaxLength]
        public string? DesignPreview { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedPrice { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "pending"; // pending, contacted, quoted, completed, cancelled

        [StringLength(100)]
        public string? AssignedTo { get; set; } // Staff member handling the request

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ContactedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation properties
        public virtual CustomDesign? Design { get; set; }
        public virtual Product? Product { get; set; }

        // Computed properties
        [NotMapped]
        public string ContactInfo
        {
            get
            {
                return PreferredContact switch
                {
                    "phone" => Phone ?? "N/A",
                    "zalo" => Zalo ?? "N/A",
                    "facebook" => Facebook ?? "N/A",
                    _ => "N/A"
                };
            }
        }

        [NotMapped]
        public int DaysWaiting
        {
            get
            {
                var referenceDate = ContactedAt ?? DateTime.UtcNow;
                return (int)(referenceDate - RequestedAt).TotalDays;
            }
        }

        [NotMapped]
        public string PriorityLevel
        {
            get
            {
                return DaysWaiting switch
                {
                    >= 7 => "high",
                    >= 3 => "medium",
                    _ => "normal"
                };
            }
        }

        // Methods for status management
        public void MarkAsContacted(string staffMember)
        {
            Status = "contacted";
            ContactedAt = DateTime.UtcNow;
            AssignedTo = staffMember;
        }

        public void MarkAsQuoted(decimal price)
        {
            Status = "quoted";
            EstimatedPrice = price;
        }

        public void MarkAsCompleted()
        {
            Status = "completed";
            CompletedAt = DateTime.UtcNow;
        }

        public void Cancel(string reason = "")
        {
            Status = "cancelled";
            if (!string.IsNullOrEmpty(reason))
            {
                Notes = string.IsNullOrEmpty(Notes) ? reason : $"{Notes}\nCancelled: {reason}";
            }
        }
    }
}