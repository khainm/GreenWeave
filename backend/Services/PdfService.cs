using backend.Interfaces.Services;
using backend.Models;
using System.Text;
using DinkToPdf;
using DinkToPdf.Contracts;

namespace backend.Services
{
    public class PdfService : IPdfService
    {
        private readonly ILogger<PdfService> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly IConverter _converter;

        public PdfService(ILogger<PdfService> logger, IWebHostEnvironment environment, IConverter converter)
        {
            _logger = logger;
            _environment = environment;
            _converter = converter;
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(Order order, Invoice invoice)
        {
            try
            {
                // Tạo HTML template
                var htmlContent = CreateInvoiceHtmlTemplate(order, invoice);
                
                // Sử dụng DinkToPdf để convert HTML sang PDF
                // Cần cài package DinkToPdf
                var pdfBytes = await ConvertHtmlToPdfAsync(htmlContent);
                
                return pdfBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF for invoice: {InvoiceId}", invoice.Id);
                throw;
            }
        }

        public async Task<string> SavePdfToFileAsync(byte[] pdfBytes, string fileName)
        {
            try
            {
                // Tạo thư mục invoices nếu chưa có
                var invoicesDir = Path.Combine(_environment.WebRootPath, "invoices");
                if (!Directory.Exists(invoicesDir))
                {
                    Directory.CreateDirectory(invoicesDir);
                }

                var filePath = Path.Combine(invoicesDir, fileName);
                await File.WriteAllBytesAsync(filePath, pdfBytes);
                
                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving PDF file: {FileName}", fileName);
                throw;
            }
        }

        public string CreateInvoiceHtmlTemplate(Order order, Invoice invoice)
        {
            var html = new StringBuilder();
            
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html lang='vi'>");
            html.AppendLine("<head>");
            html.AppendLine("    <meta charset='UTF-8'>");
            html.AppendLine("    <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            html.AppendLine("    <title>Hóa đơn GreenWeave</title>");
            html.AppendLine("    <style>");
            html.AppendLine(GetInvoiceStylesheet());
            html.AppendLine("    </style>");
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            
            // Header với logo và thông tin công ty
            html.AppendLine("    <div class='invoice-header'>");
            html.AppendLine("        <div class='company-info'>");
            html.AppendLine("            <h1>GreenWeave</h1>");
            html.AppendLine("            <p>Thời trang bền vững - Eco-friendly Fashion</p>");
            html.AppendLine("            <p>Email: info@greenweave.com | Hotline: 1900-123-456</p>");
            html.AppendLine("        </div>");
            html.AppendLine("        <div class='invoice-info'>");
            html.AppendLine($"           <h2>HÓA ĐƠN BÁN HÀNG</h2>");
            html.AppendLine($"           <p><strong>Số hóa đơn:</strong> {invoice.InvoiceNumber}</p>");
            html.AppendLine($"           <p><strong>Ngày:</strong> {invoice.CreatedAt:dd/MM/yyyy HH:mm}</p>");
            html.AppendLine($"           <p><strong>Mã đơn hàng:</strong> {order.OrderNumber}</p>");
            html.AppendLine("        </div>");
            html.AppendLine("    </div>");
            
            // Thông tin khách hàng
            html.AppendLine("    <div class='customer-info'>");
            html.AppendLine("        <h3>Thông tin khách hàng</h3>");
            html.AppendLine($"       <p><strong>Họ tên:</strong> {invoice.CustomerName}</p>");
            html.AppendLine($"       <p><strong>Email:</strong> {invoice.CustomerEmail}</p>");
            if (!string.IsNullOrEmpty(invoice.CustomerPhone))
            {
                html.AppendLine($"       <p><strong>Điện thoại:</strong> {invoice.CustomerPhone}</p>");
            }
            html.AppendLine($"       <p><strong>Địa chỉ giao hàng:</strong> {order.ShippingAddress.AddressLine}, {order.ShippingAddress.Ward}, {order.ShippingAddress.District}, {order.ShippingAddress.Province}</p>");
            html.AppendLine("    </div>");
            
            // Bảng sản phẩm
            html.AppendLine("    <div class='items-table'>");
            html.AppendLine("        <table>");
            html.AppendLine("            <thead>");
            html.AppendLine("                <tr>");
            html.AppendLine("                    <th>STT</th>");
            html.AppendLine("                    <th>Sản phẩm</th>");
            html.AppendLine("                    <th>Mã SP</th>");
            html.AppendLine("                    <th>Số lượng</th>");
            html.AppendLine("                    <th>Đơn giá</th>");
            html.AppendLine("                    <th>Thành tiền</th>");
            html.AppendLine("                </tr>");
            html.AppendLine("            </thead>");
            html.AppendLine("            <tbody>");
            
            int index = 1;
            foreach (var item in order.Items)
            {
                html.AppendLine("                <tr>");
                html.AppendLine($"                   <td>{index}</td>");
                html.AppendLine($"                   <td>{item.ProductName}</td>");
                html.AppendLine($"                   <td>{item.ProductSku}</td>");
                html.AppendLine($"                   <td>{item.Quantity}</td>");
                html.AppendLine($"                   <td>{item.UnitPrice:N0} ₫</td>");
                html.AppendLine($"                   <td>{item.TotalPrice:N0} ₫</td>");
                html.AppendLine("                </tr>");
                index++;
            }
            
            html.AppendLine("            </tbody>");
            html.AppendLine("        </table>");
            html.AppendLine("    </div>");
            
            // Tổng tiền
            html.AppendLine("    <div class='total-section'>");
            html.AppendLine("        <div class='total-row'>");
            html.AppendLine($"           <span>Tạm tính:</span>");
            html.AppendLine($"           <span>{invoice.Subtotal:N0} ₫</span>");
            html.AppendLine("        </div>");
            html.AppendLine("        <div class='total-row'>");
            html.AppendLine($"           <span>Phí vận chuyển:</span>");
            html.AppendLine($"           <span>{invoice.ShippingFee:N0} ₫</span>");
            html.AppendLine("        </div>");
            if (invoice.Discount > 0)
            {
                html.AppendLine("        <div class='total-row'>");
                html.AppendLine($"           <span>Giảm giá:</span>");
                html.AppendLine($"           <span>-{invoice.Discount:N0} ₫</span>");
                html.AppendLine("        </div>");
            }
            html.AppendLine("        <div class='total-row final-total'>");
            html.AppendLine($"           <span><strong>Tổng cộng:</strong></span>");
            html.AppendLine($"           <span><strong>{invoice.Total:N0} ₫</strong></span>");
            html.AppendLine("        </div>");
            html.AppendLine("    </div>");
            
            // Footer
            html.AppendLine("    <div class='invoice-footer'>");
            html.AppendLine("        <p>Cảm ơn bạn đã mua hàng tại GreenWeave!</p>");
            html.AppendLine("        <p>Mọi thắc mắc xin liên hệ: support@greenweave.com hoặc 1900-123-456</p>");
            html.AppendLine("    </div>");
            
            html.AppendLine("</body>");
            html.AppendLine("</html>");
            
            return html.ToString();
        }

        private async Task<byte[]> ConvertHtmlToPdfAsync(string htmlContent)
        {
            try
            {
                var doc = new HtmlToPdfDocument()
                {
                    GlobalSettings = {
                        ColorMode = ColorMode.Color,
                        Orientation = Orientation.Portrait,
                        PaperSize = PaperKind.A4,
                        Margins = new MarginSettings { Top = 10, Bottom = 10, Left = 10, Right = 10 },
                        DocumentTitle = "Hóa đơn GreenWeave",
                        DPI = 300
                    },
                    Objects = {
                        new ObjectSettings() {
                            PagesCount = true,
                            HtmlContent = htmlContent,
                            WebSettings = { DefaultEncoding = "utf-8" },
                            HeaderSettings = { FontName = "Arial", FontSize = 9, Right = "Trang [page] / [toPage]", Line = true },
                            FooterSettings = { FontName = "Arial", FontSize = 9, Line = true, Center = "GreenWeave - Thời trang bền vững" }
                        }
                    }
                };

                var pdfBytes = _converter.Convert(doc);
                return await Task.FromResult(pdfBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting HTML to PDF");
                throw new InvalidOperationException("Không thể tạo file PDF. Vui lòng thử lại sau.", ex);
            }
        }

        private string GetInvoiceStylesheet()
        {
            return @"
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                    background-color: #fff;
                    padding: 20px;
                }
                
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #22c55e;
                    padding-bottom: 20px;
                }
                
                .company-info h1 {
                    color: #22c55e;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .company-info p {
                    color: #666;
                    margin-bottom: 3px;
                }
                
                .invoice-info {
                    text-align: right;
                }
                
                .invoice-info h2 {
                    color: #22c55e;
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                
                .customer-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
                
                .customer-info h3 {
                    color: #22c55e;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                
                .items-table {
                    margin-bottom: 25px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #ddd;
                }
                
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px 8px;
                    text-align: left;
                }
                
                th {
                    background-color: #22c55e;
                    color: white;
                    font-weight: bold;
                    text-align: center;
                }
                
                td {
                    text-align: center;
                }
                
                td:nth-child(2) {
                    text-align: left;
                }
                
                .total-section {
                    margin-left: auto;
                    width: 300px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 15px;
                    border-bottom: 1px solid #eee;
                }
                
                .total-row:last-child {
                    border-bottom: none;
                }
                
                .final-total {
                    background-color: #22c55e;
                    color: white;
                    font-size: 16px;
                }
                
                .invoice-footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                
                .invoice-footer p {
                    margin-bottom: 5px;
                }
            ";
        }
    }
}