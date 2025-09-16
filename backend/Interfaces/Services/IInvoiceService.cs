using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IInvoiceService
    {
        /// <summary>
        /// Tạo biên lai cho đơn hàng
        /// </summary>
        Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto);
        
        /// <summary>
        /// Tạo file PDF biên lai
        /// </summary>
        Task<string> GenerateInvoicePdfAsync(int orderId);
        
        /// <summary>
        /// Gửi biên lai qua email
        /// </summary>
        Task<bool> SendInvoiceEmailAsync(int invoiceId);
        
        /// <summary>
        /// Tạo và gửi biên lai tự động khi xác nhận đơn hàng
        /// </summary>
        Task<InvoiceDto> ProcessOrderConfirmationAsync(int orderId);
        
        /// <summary>
        /// Lấy biên lai theo đơn hàng
        /// </summary>
        Task<InvoiceDto?> GetInvoiceByOrderIdAsync(int orderId);
        
        /// <summary>
        /// Lấy danh sách biên lai
        /// </summary>
        Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync();

        /// <summary>
        /// Lấy biên lai theo ID
        /// </summary>
        Task<InvoiceDto?> GetInvoiceByIdAsync(int id);

        /// <summary>
        /// Lấy biên lai theo số biên lai
        /// </summary>
        Task<InvoiceDto?> GetInvoiceByNumberAsync(string invoiceNumber);

        /// <summary>
        /// Tạo và gửi biên lai cho đơn hàng
        /// </summary>
        Task<bool> GenerateInvoiceAsync(int orderId, bool sendEmail = true);

        /// <summary>
        /// Gửi lại biên lai qua email
        /// </summary>
        Task<bool> ResendInvoiceAsync(int invoiceId);
    }
}