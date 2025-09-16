using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IPdfService
    {
        /// <summary>
        /// Tạo PDF biên lai từ dữ liệu đơn hàng
        /// </summary>
        Task<byte[]> GenerateInvoicePdfAsync(Order order, Invoice invoice);
        
        /// <summary>
        /// Lưu PDF vào file system
        /// </summary>
        Task<string> SavePdfToFileAsync(byte[] pdfBytes, string fileName);
        
        /// <summary>
        /// Tạo template HTML cho biên lai
        /// </summary>
        string CreateInvoiceHtmlTemplate(Order order, Invoice invoice);
    }
}