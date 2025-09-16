using backend.Data;
using backend.Interfaces.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InvoiceRepository> _logger;

        public InvoiceRepository(ApplicationDbContext context, ILogger<InvoiceRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Invoice> CreateAsync(Invoice invoice)
        {
            try
            {
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();
                return invoice;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice for order: {OrderId}", invoice.OrderId);
                throw;
            }
        }

        public async Task<Invoice> UpdateAsync(Invoice invoice)
        {
            try
            {
                invoice.UpdatedAt = DateTime.UtcNow;
                _context.Invoices.Update(invoice);
                await _context.SaveChangesAsync();
                return invoice;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice: {InvoiceId}", invoice.Id);
                throw;
            }
        }

        public async Task<Invoice?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Invoices
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Items)
                    .FirstOrDefaultAsync(i => i.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by id: {InvoiceId}", id);
                throw;
            }
        }

        public async Task<Invoice?> GetByOrderIdAsync(int orderId)
        {
            try
            {
                return await _context.Invoices
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Items)
                    .FirstOrDefaultAsync(i => i.OrderId == orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by order id: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<Invoice?> GetByInvoiceNumberAsync(string invoiceNumber)
        {
            try
            {
                return await _context.Invoices
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.ShippingAddress)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Items)
                    .FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by invoice number: {InvoiceNumber}", invoiceNumber);
                throw;
            }
        }

        public async Task<IEnumerable<Invoice>> GetAllAsync()
        {
            try
            {
                return await _context.Invoices
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Customer)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all invoices");
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null) return false;

                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting invoice: {InvoiceId}", id);
                throw;
            }
        }

        public async Task<string> GenerateInvoiceNumberAsync()
        {
            try
            {
                var today = DateTime.UtcNow;
                var prefix = $"INV{today:yyyyMMdd}";
                
                var lastInvoice = await _context.Invoices
                    .Where(i => i.InvoiceNumber.StartsWith(prefix))
                    .OrderByDescending(i => i.InvoiceNumber)
                    .FirstOrDefaultAsync();

                if (lastInvoice == null)
                {
                    return $"{prefix}001";
                }

                var lastNumber = lastInvoice.InvoiceNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumber, out var number))
                {
                    return $"{prefix}{(number + 1):D3}";
                }

                return $"{prefix}001";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating invoice number");
                throw;
            }
        }
    }
}