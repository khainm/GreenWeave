using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;
        private readonly IViettelPostPrintService _viettelPostPrintService;
        private readonly ILogger<InvoiceService> _logger;

        public InvoiceService(
            IInvoiceRepository invoiceRepository,
            IOrderRepository orderRepository,
            IPdfService pdfService,
            IEmailService emailService,
            IViettelPostPrintService viettelPostPrintService,
            ILogger<InvoiceService> logger)
        {
            _invoiceRepository = invoiceRepository;
            _orderRepository = orderRepository;
            _pdfService = pdfService;
            _emailService = emailService;
            _viettelPostPrintService = viettelPostPrintService;
            _logger = logger;
        }

        public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto)
        {
            try
            {
                // Lấy thông tin đơn hàng
                var order = await _orderRepository.GetByIdAsync(createInvoiceDto.OrderId);
                if (order == null)
                {
                    throw new ArgumentException("Không tìm thấy đơn hàng");
                }

                // Kiểm tra xem đã có invoice cho đơn hàng này chưa
                var existingInvoice = await _invoiceRepository.GetByOrderIdAsync(createInvoiceDto.OrderId);
                if (existingInvoice != null)
                {
                    throw new ArgumentException("Đơn hàng này đã có biên lai");
                }

                // Tạo invoice number
                var invoiceNumber = await _invoiceRepository.GenerateInvoiceNumberAsync();

                // Tạo invoice
                var invoice = new Invoice
                {
                    InvoiceNumber = invoiceNumber,
                    OrderId = createInvoiceDto.OrderId,
                    CustomerEmail = createInvoiceDto.CustomerEmail,
                    CustomerName = createInvoiceDto.CustomerName,
                    CustomerPhone = createInvoiceDto.CustomerPhone,
                    Subtotal = order.Subtotal,
                    ShippingFee = order.ShippingFee,
                    Discount = order.Discount,
                    Total = order.Total,
                    Status = InvoiceStatus.Generated,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdInvoice = await _invoiceRepository.CreateAsync(invoice);
                return MapToDto(createdInvoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice for order: {OrderId}", createInvoiceDto.OrderId);
                throw;
            }
        }

        public async Task<string> GenerateInvoicePdfAsync(int orderId)
        {
            try
            {
                // Lấy thông tin đơn hàng và invoice
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    throw new ArgumentException("Không tìm thấy đơn hàng");
                }

                var invoice = await _invoiceRepository.GetByOrderIdAsync(orderId);
                if (invoice == null)
                {
                    throw new ArgumentException("Không tìm thấy biên lai cho đơn hàng này");
                }

                // Tạo PDF
                var pdfBytes = await _pdfService.GenerateInvoicePdfAsync(order, invoice);
                var fileName = $"HoaDon_{invoice.InvoiceNumber}.pdf";
                var filePath = await _pdfService.SavePdfToFileAsync(pdfBytes, fileName);

                // Cập nhật thông tin file vào invoice
                invoice.FilePath = filePath;
                invoice.FileName = fileName;
                await _invoiceRepository.UpdateAsync(invoice);

                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF for order: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<bool> SendInvoiceEmailAsync(int invoiceId)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    throw new ArgumentException("Không tìm thấy biên lai");
                }

                if (string.IsNullOrEmpty(invoice.FilePath) || !File.Exists(invoice.FilePath))
                {
                    throw new ArgumentException("File PDF biên lai không tồn tại");
                }

                // Gửi email
                var emailSent = await _emailService.SendOrderConfirmationEmailAsync(
                    invoice.CustomerEmail,
                    invoice.CustomerName,
                    invoice.Order.OrderNumber,
                    invoice.FilePath
                );

                // Cập nhật trạng thái
                if (emailSent)
                {
                    invoice.Status = InvoiceStatus.Sent;
                    invoice.SentAt = DateTime.UtcNow;
                    invoice.ErrorMessage = null;
                }
                else
                {
                    invoice.Status = InvoiceStatus.Failed;
                    invoice.ErrorMessage = "Gửi email thất bại";
                }

                await _invoiceRepository.UpdateAsync(invoice);
                return emailSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending invoice email: {InvoiceId}", invoiceId);
                
                // Cập nhật trạng thái thất bại
                try
                {
                    var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
                    if (invoice != null)
                    {
                        invoice.Status = InvoiceStatus.Failed;
                        invoice.ErrorMessage = ex.Message;
                        await _invoiceRepository.UpdateAsync(invoice);
                    }
                }
                catch
                {
                    // Ignore error when updating status
                }

                return false;
            }
        }

        public async Task<InvoiceDto> ProcessOrderConfirmationAsync(int orderId)
        {
            try
            {
                // Lấy thông tin đơn hàng
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    throw new ArgumentException("Không tìm thấy đơn hàng");
                }

                // Kiểm tra xem đã có invoice chưa
                var existingInvoice = await _invoiceRepository.GetByOrderIdAsync(orderId);
                if (existingInvoice != null)
                {
                    return MapToDto(existingInvoice);
                }

                // Tạo invoice
                var createInvoiceDto = new CreateInvoiceDto
                {
                    OrderId = orderId,
                    CustomerEmail = order.Customer.Email ?? string.Empty,
                    CustomerName = order.Customer.FullName ?? order.Customer.Email ?? string.Empty,
                    CustomerPhone = order.Customer.PhoneNumber
                };

                var invoice = await CreateInvoiceAsync(createInvoiceDto);

                // Tạo PDF hóa đơn custom
                await GenerateInvoicePdfAsync(orderId);

                // Tạo ViettelPost print link
                var printLinkResult = await _viettelPostPrintService.GeneratePrintLinkAsync(
                    new[] { order.OrderNumber }, 7);

                if (printLinkResult.IsSuccess)
                {
                    // Gửi email với cả PDF custom + ViettelPost link (Option 2)
                    await SendInvoiceEmailWithBothAsync(invoice.Id, printLinkResult.PrintLink, printLinkResult.ExpiryTime);
                }
                else
                {
                    _logger.LogWarning("Failed to generate ViettelPost print link for order {OrderId}: {Error}", 
                        orderId, printLinkResult.ErrorMessage);
                    
                    // Fallback: Chỉ gửi PDF custom
                    await SendInvoiceEmailAsync(invoice.Id);
                }

                // Trả về invoice đã cập nhật
                var updatedInvoice = await _invoiceRepository.GetByIdAsync(invoice.Id);
                return MapToDto(updatedInvoice!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing order confirmation for order: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<InvoiceDto?> GetInvoiceByOrderIdAsync(int orderId)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByOrderIdAsync(orderId);
                return invoice == null ? null : MapToDto(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by order id: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllInvoicesAsync()
        {
            try
            {
                var invoices = await _invoiceRepository.GetAllAsync();
                return invoices.Select(MapToDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all invoices");
                throw;
            }
        }

        public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByIdAsync(id);
                return invoice == null ? null : MapToDto(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by id: {InvoiceId}", id);
                throw;
            }
        }

        public async Task<InvoiceDto?> GetInvoiceByNumberAsync(string invoiceNumber)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByInvoiceNumberAsync(invoiceNumber);
                return invoice == null ? null : MapToDto(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice by number: {InvoiceNumber}", invoiceNumber);
                throw;
            }
        }

        public async Task<bool> GenerateInvoiceAsync(int orderId, bool sendEmail = true)
        {
            try
            {
                // Kiểm tra xem đã có invoice chưa
                var existingInvoice = await _invoiceRepository.GetByOrderIdAsync(orderId);
                if (existingInvoice != null)
                {
                    // Nếu đã có và cần gửi email thì gửi lại
                    if (sendEmail)
                    {
                        return await SendInvoiceEmailAsync(existingInvoice.Id);
                    }
                    return true;
                }

                // Tạo mới invoice
                var invoice = await ProcessOrderConfirmationAsync(orderId);
                return invoice != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating invoice for order: {OrderId}", orderId);
                return false;
            }
        }

        public async Task<bool> SendInvoiceEmailWithBothAsync(int invoiceId, string printLink, DateTimeOffset expiryTime)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    throw new ArgumentException("Không tìm thấy biên lai");
                }

                if (string.IsNullOrEmpty(invoice.FilePath) || !File.Exists(invoice.FilePath))
                {
                    throw new ArgumentException("File PDF biên lai không tồn tại");
                }

                // Gửi email với cả PDF custom + ViettelPost link
                var emailSent = await _emailService.SendOrderConfirmationEmailWithBothAsync(
                    invoice.CustomerEmail,
                    invoice.CustomerName,
                    invoice.Order.OrderNumber,
                    invoice.FilePath,
                    printLink,
                    expiryTime
                );

                // Cập nhật trạng thái
                if (emailSent)
                {
                    invoice.Status = InvoiceStatus.Sent;
                    invoice.SentAt = DateTime.UtcNow;
                    invoice.ErrorMessage = null;
                    await _invoiceRepository.UpdateAsync(invoice);
                    _logger.LogInformation("Invoice email with both PDF and ViettelPost link sent successfully for invoice: {InvoiceId}", invoiceId);
                }
                else
                {
                    invoice.Status = InvoiceStatus.Failed;
                    invoice.ErrorMessage = "Failed to send email with both PDF and ViettelPost link";
                    await _invoiceRepository.UpdateAsync(invoice);
                    _logger.LogError("Failed to send invoice email with both PDF and ViettelPost link for invoice: {InvoiceId}", invoiceId);
                }

                return emailSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending invoice email with both PDF and ViettelPost link: {InvoiceId}", invoiceId);
                return false;
            }
        }

        public async Task<bool> SendInvoiceEmailWithLinkAsync(int invoiceId, string printLink, DateTimeOffset expiryTime)
        {
            try
            {
                var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);
                if (invoice == null)
                {
                    throw new ArgumentException("Không tìm thấy biên lai");
                }

                // Gửi email với ViettelPost link
                var emailSent = await _emailService.SendOrderConfirmationEmailWithLinkAsync(
                    invoice.CustomerEmail,
                    invoice.CustomerName,
                    invoice.Order.OrderNumber,
                    printLink,
                    expiryTime
                );

                // Cập nhật trạng thái
                if (emailSent)
                {
                    invoice.Status = InvoiceStatus.Sent;
                    invoice.SentAt = DateTime.UtcNow;
                    invoice.ErrorMessage = null;
                    await _invoiceRepository.UpdateAsync(invoice);
                    _logger.LogInformation("Invoice email with ViettelPost link sent successfully for invoice: {InvoiceId}", invoiceId);
                }
                else
                {
                    invoice.Status = InvoiceStatus.Failed;
                    invoice.ErrorMessage = "Failed to send email with ViettelPost link";
                    await _invoiceRepository.UpdateAsync(invoice);
                    _logger.LogError("Failed to send invoice email with ViettelPost link for invoice: {InvoiceId}", invoiceId);
                }

                return emailSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending invoice email with ViettelPost link: {InvoiceId}", invoiceId);
                return false;
            }
        }

        public async Task<bool> ResendInvoiceAsync(int invoiceId)
        {
            try
            {
                return await SendInvoiceEmailAsync(invoiceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending invoice: {InvoiceId}", invoiceId);
                return false;
            }
        }

        private static InvoiceDto MapToDto(Invoice invoice)
        {
            return new InvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                OrderId = invoice.OrderId,
                CustomerEmail = invoice.CustomerEmail,
                CustomerName = invoice.CustomerName,
                CustomerPhone = invoice.CustomerPhone,
                Subtotal = invoice.Subtotal,
                ShippingFee = invoice.ShippingFee,
                Discount = invoice.Discount,
                Total = invoice.Total,
                Status = invoice.Status.ToString().ToLower(),
                FilePath = invoice.FilePath,
                FileName = invoice.FileName,
                CreatedAt = invoice.CreatedAt,
                UpdatedAt = invoice.UpdatedAt,
                SentAt = invoice.SentAt,
                ErrorMessage = invoice.ErrorMessage
            };
        }
    }
}