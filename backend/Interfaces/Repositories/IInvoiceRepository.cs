using backend.Models;

namespace backend.Interfaces.Repositories
{
    public interface IInvoiceRepository
    {
        Task<Invoice> CreateAsync(Invoice invoice);
        Task<Invoice> UpdateAsync(Invoice invoice);
        Task<Invoice?> GetByIdAsync(int id);
        Task<Invoice?> GetByOrderIdAsync(int orderId);
        Task<Invoice?> GetByInvoiceNumberAsync(string invoiceNumber);
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<bool> DeleteAsync(int id);
        Task<string> GenerateInvoiceNumberAsync();
    }
}