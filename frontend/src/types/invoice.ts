export type InvoiceStatus = 
  | 'generated'   // Đã tạo
  | 'sent'        // Đã gửi email
  | 'error'       // Lỗi trong quá trình tạo/gửi

export interface InvoiceDto {
  id: number
  invoiceNumber: string
  orderId: number
  customerEmail: string
  customerName: string
  customerPhone?: string
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  status: InvoiceStatus
  filePath?: string
  fileName?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  errorMessage?: string
}

export interface CreateInvoiceDto {
  orderId: number
  customerEmail: string
  customerName: string
  customerPhone?: string
}

export interface InvoiceGenerationRequest {
  orderId: number
  sendEmail?: boolean
}

export interface InvoiceFilters {
  status?: InvoiceStatus
  search?: string // Tìm theo invoice number, customer name, email
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface InvoiceListResponse {
  data: InvoiceDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface InvoiceDownloadResponse {
  fileName: string
  content: Blob
}