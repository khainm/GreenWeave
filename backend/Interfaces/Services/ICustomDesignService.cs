// 🎨 Custom Design Service Interface
// Production Ready

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface ICustomDesignService
    {
        /// <summary>
        /// Create a new custom design
        /// </summary>
        Task<Guid> CreateDesignAsync(CreateCustomDesignDto dto);

        /// <summary>
        /// Update an existing custom design
        /// </summary>
        Task<bool> UpdateDesignAsync(Guid id, UpdateCustomDesignDto dto);

        /// <summary>
        /// Get custom design by ID
        /// </summary>
        Task<CustomDesignDto?> GetDesignAsync(Guid id);

        /// <summary>
        /// Get all designs for a user
        /// </summary>
        Task<List<CustomDesignDto>> GetUserDesignsAsync(string userId);

        /// <summary>
        /// Delete a custom design
        /// </summary>
        Task<bool> DeleteDesignAsync(Guid id);

        /// <summary>
        /// Get design statistics
        /// </summary>
        Task<DesignStatistics> GetDesignStatisticsAsync();
    }

    public interface IConsultationRequestService
    {
        /// <summary>
        /// Create a new consultation request
        /// </summary>
        Task<Guid> CreateRequestAsync(CreateConsultationRequestDto dto);

        /// <summary>
        /// Get consultation request by ID
        /// </summary>
        Task<ConsultationRequestDto?> GetRequestAsync(Guid id);

        /// <summary>
        /// List consultation requests with pagination and filtering
        /// </summary>
        Task<PagedResult<ConsultationRequestDto>> ListRequestsAsync(
            string? status = null,
            string? priorityLevel = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// Update consultation request status
        /// </summary>
        Task<bool> UpdateStatusAsync(Guid id, UpdateConsultationStatusDto dto);

        /// <summary>
        /// Get consultation statistics
        /// </summary>
        Task<ConsultationStatistics> GetConsultationStatisticsAsync();
    }

    public class DesignStatistics
    {
        public int TotalDesigns { get; set; }
        public int DraftDesigns { get; set; }
        public int SavedDesigns { get; set; }
        public int FinalizedDesigns { get; set; }
        public Dictionary<string, int> ComplexityDistribution { get; set; } = new();
    }

    public class ConsultationStatistics
    {
        public int TotalRequests { get; set; }
        public int PendingRequests { get; set; }
        public int ContactedRequests { get; set; }
        public int CompletedRequests { get; set; }
        public Dictionary<string, int> PriorityDistribution { get; set; } = new();
        public double AverageResponseTime { get; set; } // in hours
    }
}
