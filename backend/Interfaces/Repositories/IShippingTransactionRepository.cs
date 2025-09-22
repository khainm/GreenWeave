using backend.Models;

namespace backend.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for shipping transactions
    /// </summary>
    public interface IShippingTransactionRepository
    {
        /// <summary>
        /// Get shipping transaction by ID
        /// </summary>
        /// <param name="id">Transaction ID</param>
        /// <returns>Shipping transaction or null</returns>
        Task<ShippingTransaction?> GetByIdAsync(int id);

        /// <summary>
        /// Get transactions by shipping request ID
        /// </summary>
        /// <param name="shippingRequestId">Shipping request ID</param>
        /// <returns>List of transactions</returns>
        Task<IEnumerable<ShippingTransaction>> GetByShippingRequestIdAsync(int shippingRequestId);

        /// <summary>
        /// Get transactions by operation type
        /// </summary>
        /// <param name="operation">Operation type</param>
        /// <param name="dateFrom">Optional date from filter</param>
        /// <param name="dateTo">Optional date to filter</param>
        /// <returns>List of transactions</returns>
        Task<IEnumerable<ShippingTransaction>> GetByOperationAsync(
            string operation, 
            DateTime? dateFrom = null, 
            DateTime? dateTo = null);

        /// <summary>
        /// Get failed transactions for retry
        /// </summary>
        /// <param name="operation">Optional operation filter</param>
        /// <param name="hoursAgo">Filter transactions from X hours ago</param>
        /// <returns>List of failed transactions</returns>
        Task<IEnumerable<ShippingTransaction>> GetFailedTransactionsAsync(
            string? operation = null, 
            int hoursAgo = 24);

        /// <summary>
        /// Get all transactions with filtering and pagination
        /// </summary>
        /// <param name="operation">Optional operation filter</param>
        /// <param name="isSuccess">Optional success status filter</param>
        /// <param name="dateFrom">Optional date from filter</param>
        /// <param name="dateTo">Optional date to filter</param>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Page size</param>
        /// <returns>Tuple of transactions and total count</returns>
        Task<(IEnumerable<ShippingTransaction> transactions, int total)> GetFilteredAsync(
            string? operation = null,
            bool? isSuccess = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// Create a new shipping transaction
        /// </summary>
        /// <param name="transaction">Transaction to create</param>
        /// <returns>Created transaction</returns>
        Task<ShippingTransaction> CreateAsync(ShippingTransaction transaction);
    }
}
