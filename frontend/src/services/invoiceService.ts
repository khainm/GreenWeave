import { apiClient, ApiException } from './apiClient'
import type { 
  InvoiceDto, 
  CreateInvoiceDto,
  InvoiceGenerationRequest,
  InvoiceDownloadResponse
} from '../types/invoice'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.greenweave.vn'

export class InvoiceService {
  private static readonly BASE_PATH = '/api/invoices'

  /**
   * Lấy danh sách tất cả hóa đơn (Admin/Staff only)
   */
  static async getAllInvoices(): Promise<InvoiceDto[]> {
    try {
      return await apiClient.get<InvoiceDto[]>(this.BASE_PATH)
    } catch (error) {
      console.error('Error loading invoices:', error)
      if (error instanceof ApiException) {
        throw new Error(`Không thể tải danh sách hóa đơn: ${error.message}`)
      }
      throw new Error('Không thể tải danh sách hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Lấy hóa đơn theo ID
   */
  static async getInvoiceById(id: number): Promise<InvoiceDto> {
    try {
      return await apiClient.get<InvoiceDto>(`${this.BASE_PATH}/${id}`)
    } catch (error) {
      console.error('Error loading invoice:', error)
      if (error instanceof ApiException) {
        if (error.status === 404) {
          throw new Error('Không tìm thấy hóa đơn')
        }
        throw new Error(`Không thể tải hóa đơn: ${error.message}`)
      }
      throw new Error('Không thể tải hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Lấy hóa đơn theo số hóa đơn
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDto> {
    try {
      return await apiClient.get<InvoiceDto>(`${this.BASE_PATH}/number/${invoiceNumber}`)
    } catch (error) {
      console.error('Error loading invoice by number:', error)
      if (error instanceof ApiException) {
        if (error.status === 404) {
          throw new Error('Không tìm thấy hóa đơn với số đã cho')
        }
        throw new Error(`Không thể tải hóa đơn: ${error.message}`)
      }
      throw new Error('Không thể tải hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Lấy hóa đơn theo ID đơn hàng
   */
  static async getInvoiceByOrderId(orderId: number): Promise<InvoiceDto | null> {
    try {
      return await apiClient.get<InvoiceDto>(`${this.BASE_PATH}/order/${orderId}`)
    } catch (error: any) {
      if (error instanceof ApiException && error.status === 404) {
        return null // Không có hóa đơn cho đơn hàng này
      }
      console.error('Error loading invoice by order ID:', error)
      throw new Error('Không thể kiểm tra hóa đơn cho đơn hàng này')
    }
  }

  /**
   * Tạo hóa đơn mới
   */
  static async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDto> {
    try {
      return await apiClient.post<InvoiceDto>(this.BASE_PATH, createInvoiceDto)
    } catch (error) {
      console.error('Error creating invoice:', error)
      if (error instanceof ApiException) {
        if (error.status === 400) {
          throw new Error('Thông tin tạo hóa đơn không hợp lệ')
        }
        if (error.status === 409) {
          throw new Error('Đơn hàng này đã có hóa đơn')
        }
        throw new Error(`Không thể tạo hóa đơn: ${error.message}`)
      }
      throw new Error('Không thể tạo hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Tạo hóa đơn cho đơn hàng (tự động hoặc thủ công)
   */
  static async generateInvoice(request: InvoiceGenerationRequest): Promise<InvoiceDto> {
    try {
      return await apiClient.post<InvoiceDto>(`${this.BASE_PATH}/generate`, request)
    } catch (error) {
      console.error('Error generating invoice:', error)
      if (error instanceof ApiException) {
        if (error.status === 400) {
          throw new Error('Không thể tạo hóa đơn cho đơn hàng này')
        }
        if (error.status === 404) {
          throw new Error('Không tìm thấy đơn hàng')
        }
        if (error.status === 409) {
          throw new Error('Đơn hàng này đã có hóa đơn')
        }
        throw new Error(`Không thể tạo hóa đơn: ${error.message}`)
      }
      throw new Error('Không thể tạo hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Gửi lại email hóa đơn
   */
  static async resendInvoice(invoiceId: number): Promise<boolean> {
    try {
      return await apiClient.post<boolean>(`${this.BASE_PATH}/${invoiceId}/resend`)
    } catch (error) {
      console.error('Error resending invoice:', error)
      if (error instanceof ApiException) {
        if (error.status === 404) {
          throw new Error('Không tìm thấy hóa đơn')
        }
        if (error.status === 400) {
          throw new Error('Không thể gửi lại hóa đơn này')
        }
        throw new Error(`Không thể gửi lại email: ${error.message}`)
      }
      throw new Error('Không thể gửi lại email hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Tải xuống file PDF hóa đơn
   */
  static async downloadInvoice(invoiceId: number): Promise<InvoiceDownloadResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.BASE_PATH}/${invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy file hóa đơn')
        }
        if (response.status === 403) {
          throw new Error('Bạn không có quyền tải xuống hóa đơn này')
        }
        throw new Error(`Lỗi tải xuống hóa đơn: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = 'invoice.pdf'
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          fileName = match[1]
        }
      }

      return {
        fileName,
        content: blob
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Không thể tải xuống hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Tải xuống file PDF hóa đơn theo số hóa đơn
   */
  static async downloadInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDownloadResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.BASE_PATH}/number/${invoiceNumber}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy hóa đơn hoặc file hóa đơn')
        }
        if (response.status === 403) {
          throw new Error('Bạn không có quyền tải xuống hóa đơn này')
        }
        throw new Error(`Lỗi tải xuống hóa đơn: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = 'invoice.pdf'
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          fileName = match[1]
        }
      }

      return {
        fileName,
        content: blob
      }
    } catch (error) {
      console.error('Error downloading invoice by number:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Không thể tải xuống hóa đơn. Vui lòng thử lại.')
    }
  }

  /**
   * Helper method để trigger download trong browser
   */
  static triggerDownload(fileName: string, blob: Blob): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  /**
   * Lấy thông tin hiển thị cho trạng thái hóa đơn
   */
  static getStatusInfo(status: string) {
    const statusMap = {
      'generated': { label: 'Đã tạo', color: 'bg-blue-100 text-blue-800' },
      'sent': { label: 'Đã gửi', color: 'bg-green-100 text-green-800' },
      'error': { label: 'Lỗi', color: 'bg-red-100 text-red-800' }
    }
    
    return statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      color: 'bg-gray-100 text-gray-800' 
    }
  }

  /**
   * Kiểm tra xem có thể thực hiện các hành động trên hóa đơn không
   */
  static canResendInvoice(invoice: InvoiceDto): boolean {
    return invoice.status === 'generated' || invoice.status === 'error'
  }

  static canDownloadInvoice(invoice: InvoiceDto): boolean {
    return invoice.status === 'generated' || invoice.status === 'sent'
  }
}

export default InvoiceService