using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Repository for WebhookLog operations
    /// </summary>
    public class WebhookLogRepository : IWebhookLogRepository
    {
        private readonly ApplicationDbContext _context;

        public WebhookLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WebhookLog>> GetAllAsync(int page = 1, int pageSize = 50)
        {
            return await _context.WebhookLogs
                .Include(w => w.Order)
                .Include(w => w.ShippingRequest)
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<WebhookLog>> GetByOrderNumberAsync(string orderNumber)
        {
            return await _context.WebhookLogs
                .Include(w => w.Order)
                .Include(w => w.ShippingRequest)
                .Where(w => w.OrderNumber == orderNumber)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<WebhookLog>> GetByOrderIdAsync(int orderId)
        {
            return await _context.WebhookLogs
                .Include(w => w.Order)
                .Include(w => w.ShippingRequest)
                .Where(w => w.OrderId == orderId)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();
        }

        public async Task<WebhookLog?> GetByIdAsync(int id)
        {
            return await _context.WebhookLogs
                .Include(w => w.Order)
                .Include(w => w.ShippingRequest)
                .FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<WebhookLog> AddAsync(WebhookLog webhookLog)
        {
            _context.WebhookLogs.Add(webhookLog);
            await _context.SaveChangesAsync();
            return webhookLog;
        }

        public async Task<WebhookLog> UpdateAsync(WebhookLog webhookLog)
        {
            webhookLog.UpdatedAt = DateTime.UtcNow;
            _context.WebhookLogs.Update(webhookLog);
            await _context.SaveChangesAsync();
            return webhookLog;
        }

        public async Task<WebhookStats> GetStatsAsync()
        {
            var totalWebhooks = await _context.WebhookLogs.CountAsync();
            var successfulWebhooks = await _context.WebhookLogs.CountAsync(w => w.IsSuccess);
            var failedWebhooks = totalWebhooks - successfulWebhooks;
            
            var lastWebhook = await _context.WebhookLogs
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();

            var recentOrderNumbers = await _context.WebhookLogs
                .OrderByDescending(w => w.CreatedAt)
                .Take(10)
                .Select(w => w.OrderNumber)
                .Distinct()
                .ToListAsync();

            return new WebhookStats
            {
                TotalWebhooks = totalWebhooks,
                SuccessfulWebhooks = successfulWebhooks,
                FailedWebhooks = failedWebhooks,
                LastWebhookTime = lastWebhook?.CreatedAt,
                RecentOrderNumbers = recentOrderNumbers
            };
        }

        public async Task<IEnumerable<WebhookLog>> GetRecentAsync(int count = 10)
        {
            return await _context.WebhookLogs
                .Include(w => w.Order)
                .Include(w => w.ShippingRequest)
                .OrderByDescending(w => w.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
    }
}
