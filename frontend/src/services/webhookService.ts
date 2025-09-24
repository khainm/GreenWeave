import { apiClient } from './apiClient'

export interface WebhookEvent {
  id: number
  orderNumber: string
  orderReference: string
  orderStatusDate: string
  orderStatus: number
  statusDescription: string
  note: string
  moneyCollection: number
  moneyFeeCod: number
  moneyTotal: number
  expectedDelivery: string
  productWeight: number
  orderService: string
  token: string
  isSuccess: boolean
  errorMessage?: string
  rawData?: string
  orderId?: number
  shippingRequestId?: number
  createdAt: string
  updatedAt: string
}

export interface WebhookStats {
  totalWebhooks: number
  successfulWebhooks: number
  failedWebhooks: number
  lastWebhookTime?: string
  recentOrderNumbers: string[]
}

export interface WebhookLogListResult {
  isSuccess: boolean
  message: string
  webhookLogs: WebhookEvent[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export class WebhookService {
  private static readonly BASE_PATH = '/api/webhooklog'

  /**
   * Get all webhook logs with pagination
   */
  static async getWebhookLogs(page: number = 1, pageSize: number = 50): Promise<WebhookLogListResult> {
    try {
      console.log(`🔍 [WebhookService] Getting webhook logs - page: ${page}, pageSize: ${pageSize}`)
      const response = await apiClient.get<WebhookLogListResult>(`${this.BASE_PATH}?page=${page}&pageSize=${pageSize}`)
      console.log(`✅ [WebhookService] Received webhook logs:`, response)
      return response
    } catch (error) {
      console.error('❌ [WebhookService] Error getting webhook logs:', error)
      throw new Error('Không thể tải danh sách webhook logs')
    }
  }

  /**
   * Get webhook logs by order number
   */
  static async getWebhookLogsByOrderNumber(orderNumber: string): Promise<WebhookEvent[]> {
    try {
      console.log(`🔍 [WebhookService] Getting webhook logs for order: ${orderNumber}`)
      const response = await apiClient.get<{ success: boolean; data: WebhookEvent[] }>(`${this.BASE_PATH}/order/${orderNumber}`)
      console.log(`✅ [WebhookService] Received webhook logs for order:`, response)
      return response.data || []
    } catch (error) {
      console.error('❌ [WebhookService] Error getting webhook logs by order number:', error)
      throw new Error('Không thể tải webhook logs theo order number')
    }
  }

  /**
   * Get webhook logs by order ID
   */
  static async getWebhookLogsByOrderId(orderId: number): Promise<WebhookEvent[]> {
    try {
      console.log(`🔍 [WebhookService] Getting webhook logs for order ID: ${orderId}`)
      const response = await apiClient.get<{ success: boolean; data: WebhookEvent[] }>(`${this.BASE_PATH}/order-id/${orderId}`)
      console.log(`✅ [WebhookService] Received webhook logs for order ID:`, response)
      return response.data || []
    } catch (error) {
      console.error('❌ [WebhookService] Error getting webhook logs by order ID:', error)
      throw new Error('Không thể tải webhook logs theo order ID')
    }
  }

  /**
   * Get webhook log by ID
   */
  static async getWebhookLogById(id: number): Promise<WebhookEvent> {
    try {
      console.log(`🔍 [WebhookService] Getting webhook log by ID: ${id}`)
      const response = await apiClient.get<{ success: boolean; data: WebhookEvent }>(`${this.BASE_PATH}/${id}`)
      console.log(`✅ [WebhookService] Received webhook log:`, response)
      return response.data
    } catch (error) {
      console.error('❌ [WebhookService] Error getting webhook log by ID:', error)
      throw new Error('Không thể tải webhook log')
    }
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(): Promise<WebhookStats> {
    try {
      console.log(`🔍 [WebhookService] Getting webhook stats`)
      const response = await apiClient.get<{ success: boolean; data: WebhookStats }>(`${this.BASE_PATH}/stats`)
      console.log(`✅ [WebhookService] Received webhook stats:`, response)
      return response.data
    } catch (error) {
      console.error('❌ [WebhookService] Error getting webhook stats:', error)
      throw new Error('Không thể tải thống kê webhook')
    }
  }

  /**
   * Get recent webhook logs
   */
  static async getRecentWebhookLogs(count: number = 10): Promise<WebhookEvent[]> {
    try {
      console.log(`🔍 [WebhookService] Getting recent webhook logs - count: ${count}`)
      const response = await apiClient.get<{ success: boolean; data: WebhookEvent[] }>(`${this.BASE_PATH}/recent?count=${count}`)
      console.log(`✅ [WebhookService] Received recent webhook logs:`, response)
      return response.data || []
    } catch (error) {
      console.error('❌ [WebhookService] Error getting recent webhook logs:', error)
      throw new Error('Không thể tải webhook logs gần đây')
    }
  }
}
