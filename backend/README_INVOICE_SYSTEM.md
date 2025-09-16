# Hệ thống Tự động tạo Hóa đơn và Gửi Email - GreenWeave

## Tổng quan

Hệ thống tự động tạo hóa đơn PDF và gửi email khi admin xác nhận đơn hàng. Sử dụng SendGrid để gửi email với hóa đơn đính kèm.

## Cấu hình

### 1. SendGrid Setup

Cập nhật `appsettings.json`:

```json
{
  "SendGrid": {
    "ApiKey": "YOUR_SENDGRID_API_KEY",
    "FromEmail": "noreply@greenweave.com", 
    "FromName": "GreenWeave Store"
  }
}
```

### 2. Lấy SendGrid API Key

1. Đăng ký tài khoản tại [SendGrid](https://sendgrid.com/)
2. Vào Settings → API Keys
3. Tạo API Key mới với quyền "Full Access" hoặc "Mail Send"
4. Copy API Key và thay thế `YOUR_SENDGRID_API_KEY`

### 3. Verify Domain (Tùy chọn)

Để tăng độ tin cậy:
1. Vào Settings → Sender Authentication
2. Verify domain của bạn (ví dụ: greenweave.com)
3. Cập nhật FromEmail thành email thuộc domain đã verify

## Workflow

### 1. Khách hàng đặt hàng
- Đơn hàng được tạo với trạng thái `Pending`
- Chưa có hóa đơn nào được tạo

### 2. Admin xác nhận đơn hàng
- Admin thay đổi trạng thái từ `Pending` → `Confirmed`
- Hệ thống tự động:
  1. Tạo Invoice record trong database
  2. Generate PDF hóa đơn với template đẹp
  3. Lưu PDF vào thư mục `wwwroot/invoices/`
  4. Gửi email với PDF đính kèm qua SendGrid
  5. Cập nhật trạng thái Invoice

### 3. Khách hàng nhận email
- Email xác nhận đơn hàng với giao diện đẹp
- Hóa đơn PDF đính kèm
- Thông tin theo dõi đơn hàng

## API Endpoints

### Orders Controller
```http
PUT /api/orders/{id}/status
Content-Type: application/json

{
  "newStatus": "Confirmed",
  "notes": "Đơn hàng đã được xác nhận"
}
```

### Invoices Controller
```http
# Lấy tất cả hóa đơn (Admin/Staff)
GET /api/invoices

# Lấy hóa đơn theo ID
GET /api/invoices/{id}

# Lấy hóa đơn theo số hóa đơn
GET /api/invoices/number/{invoiceNumber}

# Tạo hóa đơn cho đơn hàng
POST /api/invoices
{
  "orderId": 123,
  "customerEmail": "customer@email.com",
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0123456789"
}

# Tạo và gửi hóa đơn
POST /api/invoices/generate
{
  "orderId": 123,
  "sendEmail": true
}

# Gửi lại hóa đơn
POST /api/invoices/{id}/resend

# Tải xuống PDF
GET /api/invoices/{id}/download
```

## Database Schema

### Invoice Table
```sql
CREATE TABLE [Invoices] (
    [Id] int NOT NULL IDENTITY,
    [InvoiceNumber] nvarchar(20) NOT NULL,
    [OrderId] int NOT NULL,
    [CustomerEmail] nvarchar(255) NOT NULL,
    [CustomerName] nvarchar(100) NOT NULL,
    [CustomerPhone] nvarchar(15) NULL,
    [Subtotal] decimal(18,2) NOT NULL,
    [ShippingFee] decimal(18,2) NOT NULL DEFAULT 0.0,
    [Discount] decimal(18,2) NOT NULL DEFAULT 0.0,
    [Total] decimal(18,2) NOT NULL,
    [Status] nvarchar(20) NOT NULL, -- Generated, Sent, Failed
    [FilePath] nvarchar(500) NULL,
    [FileName] nvarchar(100) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [SentAt] datetime2 NULL,
    [ErrorMessage] nvarchar(500) NULL
);
```

## Services Architecture

### 1. InvoiceService
- `ProcessOrderConfirmationAsync()`: Main workflow khi xác nhận đơn hàng
- `CreateInvoiceAsync()`: Tạo Invoice record
- `GenerateInvoicePdfAsync()`: Tạo PDF
- `SendInvoiceEmailAsync()`: Gửi email

### 2. PdfService  
- `GenerateInvoicePdfAsync()`: Convert HTML template → PDF
- Professional template với CSS styling
- Company branding và thông tin chi tiết

### 3. EmailService (SendGrid)
- `SendOrderConfirmationEmailAsync()`: Gửi email xác nhận
- `SendOrderStatusUpdateEmailAsync()`: Gửi email cập nhật trạng thái
- Responsive HTML email templates

### 4. OrderService
- `UpdateOrderStatusAsync()`: Cập nhật trạng thái + trigger invoice workflow

## File Structure

```
backend/
├── Controllers/
│   ├── OrdersController.cs
│   └── InvoicesController.cs
├── Services/
│   ├── InvoiceService.cs
│   ├── PdfService.cs
│   ├── EmailService.cs (SendGrid)
│   └── OrderService.cs
├── Models/
│   ├── Invoice.cs
│   └── Order.cs
├── DTOs/
│   └── InvoiceDto.cs
└── wwwroot/
    └── invoices/ (PDF files)
```

## Testing

### 1. Test Order Confirmation Flow
```bash
# 1. Tạo đơn hàng mới
POST /api/orders

# 2. Xác nhận đơn hàng  
PUT /api/orders/{id}/status
{
  "newStatus": "Confirmed"
}

# 3. Kiểm tra email và PDF
```

### 2. Test Manual Invoice Generation
```bash
# Tạo hóa đơn thủ công
POST /api/invoices/generate
{
  "orderId": 123,
  "sendEmail": true
}
```

### 3. Test Invoice Download
```bash
# Tải xuống PDF
GET /api/invoices/{id}/download
```

## Troubleshooting

### 1. Email không gửi được
- Kiểm tra SendGrid API Key
- Verify domain authentication
- Check logs trong console

### 2. PDF không tạo được
- Kiểm tra thư mục `wwwroot/invoices/` có quyền write
- Verify DinkToPdf package đã cài đặt

### 3. Lỗi authorization
- Đảm bảo user có role `Admin` hoặc `Staff`
- Check JWT token hợp lệ

## Production Deployment

### 1. Environment Variables
```bash
export SENDGRID_API_KEY="your_api_key"
export ASPNETCORE_ENVIRONMENT="Production"
```

### 2. File Storage
- Cân nhắc sử dụng Azure Blob Storage cho PDF files
- Setup backup cho invoice files

### 3. Monitoring
- Log SendGrid API responses
- Monitor email delivery rates
- Track invoice generation success/failure

## Tính năng nâng cao (Tương lai)

1. **Bulk Invoice Generation**: Tạo hóa đơn hàng loạt
2. **Email Templates**: Customizable email templates
3. **Invoice Numbering**: Custom invoice number formats
4. **Multi-language**: Support multiple languages
5. **Digital Signature**: PDF signing capability
6. **Webhook Integration**: Real-time status updates
7. **Analytics Dashboard**: Email delivery analytics