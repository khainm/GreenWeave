using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Repository implementation for shipping transactions
    /// </summary>
    public class ShippingTransactionRepository : IShippingTransactionRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ShippingTransactionRepository> _logger;

        public ShippingTransactionRepository(ApplicationDbContext context, ILogger<ShippingTransactionRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ShippingTransaction?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.ShippingTransactions
                    .Include(st => st.ShippingRequest)
                        .ThenInclude(sr => sr.Order)
                    .FirstOrDefaultAsync(st => st.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping transaction by ID {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingTransaction>> GetByShippingRequestIdAsync(int shippingRequestId)
        {
            try
            {
                return await _context.ShippingTransactions
                    .Where(st => st.ShippingRequestId == shippingRequestId)
                    .OrderByDescending(st => st.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping transactions by request ID {ShippingRequestId}", shippingRequestId);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingTransaction>> GetByOperationAsync(
            string operation, 
            DateTime? dateFrom = null, 
            DateTime? dateTo = null)
        {
            try
            {
                var query = _context.ShippingTransactions
                    .Where(st => st.Operation == operation);

                if (dateFrom.HasValue)
                {
                    query = query.Where(st => st.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    query = query.Where(st => st.CreatedAt <= dateTo.Value);
                }

                return await query
                    .OrderByDescending(st => st.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting shipping transactions by operation {Operation}", operation);
                throw;
            }
        }

        public async Task<IEnumerable<ShippingTransaction>> GetFailedTransactionsAsync(
            string? operation = null, 
            int hoursAgo = 24)
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddHours(-hoursAgo);
                var query = _context.ShippingTransactions
                    .Where(st => !st.IsSuccess && st.CreatedAt >= cutoffTime);

                if (!string.IsNullOrEmpty(operation))
                {
                    query = query.Where(st => st.Operation == operation);
                }

                return await query
                    .Include(st => st.ShippingRequest)
                        .ThenInclude(sr => sr.Order)
                    .OrderByDescending(st => st.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failed shipping transactions");
                throw;
            }
        }

        public async Task<(IEnumerable<ShippingTransaction> transactions, int total)> GetFilteredAsync(
            string? operation = null,
            bool? isSuccess = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                var query = _context.ShippingTransactions
                    .Include(st => st.ShippingRequest)
                        .ThenInclude(sr => sr.Order)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(operation))
                {
                    query = query.Where(st => st.Operation == operation);
                }

                if (isSuccess.HasValue)
                {
                    query = query.Where(st => st.IsSuccess == isSuccess.Value);
                }

                if (dateFrom.HasValue)
                {
                    query = query.Where(st => st.CreatedAt >= dateFrom.Value);
                }

                if (dateTo.HasValue)
                {
                    query = query.Where(st => st.CreatedAt <= dateTo.Value);
                }

                var total = await query.CountAsync();

                var transactions = await query
                    .OrderByDescending(st => st.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (transactions, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered shipping transactions");
                throw;
            }
        }

        public async Task<ShippingTransaction> CreateAsync(ShippingTransaction transaction)
        {
            try
            {
                _context.ShippingTransactions.Add(transaction);
                await _context.SaveChangesAsync();
                return transaction;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shipping transaction");
                throw;
            }
        }
    }
}
