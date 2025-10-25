using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Repository implementation for shipping requests
    /// </summary>
    public class ShippingRequestRepository : IShippingRequestRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ShippingRequestRepository> _logger;

        public ShippingRequestRepository(ApplicationDbContext context, ILogger<ShippingRequestRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ShippingRequest?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .Include(sr => sr.Transactions)
                    .FirstOrDefaultAsync(sr => sr.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping request by ID {Id}", id);
                throw;
            }
        }

        public async Task<ShippingRequest?> GetByOrderIdAsync(int orderId)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .Include(sr => sr.Transactions)
                    .FirstOrDefaultAsync(sr => sr.OrderId == orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping request by order ID {OrderId}", orderId);
                throw;
            }
        }

        public async Task<ShippingRequest?> GetByTrackingCodeAsync(string trackingCode)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .FirstOrDefaultAsync(sr => sr.TrackingCode == trackingCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping request by tracking code {TrackingCode}", trackingCode);
                throw;
            }
        }

        /// <summary>
        /// ✅ NEW: Get shipping request by external ID (ORDER_NUMBER for timeout recovery)
        /// </summary>
        public async Task<ShippingRequest?> GetByExternalIdAsync(string externalId)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .FirstOrDefaultAsync(sr => sr.ExternalId == externalId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping request by external ID {ExternalId}", externalId);
                throw;
            }
        }

        public async Task<(IEnumerable<ShippingRequest> requests, int total)> GetFilteredAsync(
            ShippingProvider? provider = null,
            ShippingStatus? status = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                var query = _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .AsQueryable();

                // Apply filters
                if (provider.HasValue)
                {
                    query = query.Where(sr => sr.Provider == provider.Value);
                }

                if (status.HasValue)
                {
                    query = query.Where(sr => sr.Status == status.Value);
                }

                if (dateFrom.HasValue)
                {
                    query = query.Where(sr => sr.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    query = query.Where(sr => sr.CreatedAt <= dateTo.Value);
                }

                var total = await query.CountAsync();

                var requests = await query
                    .OrderByDescending(sr => sr.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (requests, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered shipping requests");
                throw;
            }
        }

        public async Task<ShippingRequest> CreateAsync(ShippingRequest shippingRequest)
        {
            try
            {
                _context.ShippingRequests.Add(shippingRequest);
                await _context.SaveChangesAsync();
                return shippingRequest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipping request for order {OrderId}", shippingRequest.OrderId);
                throw;
            }
        }

        public async Task<ShippingRequest> UpdateAsync(ShippingRequest shippingRequest)
        {
            try
            {
                shippingRequest.UpdatedAt = DateTime.UtcNow;
                _context.ShippingRequests.Update(shippingRequest);
                await _context.SaveChangesAsync();
                return shippingRequest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shipping request {Id}", shippingRequest.Id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var shippingRequest = await _context.ShippingRequests.FindAsync(id);
                if (shippingRequest == null)
                {
                    return false;
                }

                _context.ShippingRequests.Remove(shippingRequest);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shipping request {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingRequest>> GetByProviderAsync(ShippingProvider provider)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Where(sr => sr.Provider == provider)
                    .OrderByDescending(sr => sr.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping requests by provider {Provider}", provider);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingRequest>> GetByStatusAsync(ShippingStatus status)
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Where(sr => sr.Status == status)
                    .OrderByDescending(sr => sr.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping requests by status {Status}", status);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingRequest>> GetPendingAsync()
        {
            try
            {
                return await _context.ShippingRequests
                    .Include(sr => sr.Order)
                        .ThenInclude(o => o.Customer)
                    .Where(sr => sr.Status == ShippingStatus.PendingPickup)
                    .OrderBy(sr => sr.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending shipping requests");
                throw;
            }
        }
    }
}
