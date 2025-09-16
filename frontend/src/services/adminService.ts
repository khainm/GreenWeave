import { apiClient } from './apiClient'
import type { Order } from '../types/order'

export interface AdminApproveOrderRequest {
  orderId: number
  notes?: string
}

export interface AdminRejectOrderRequest {
  orderId: number
  reason: string
}

export class AdminService {
  private static readonly BASE_PATH = '/api/orders'

  /**
   * Lấy danh sách đơn hàng chờ duyệt (admin only)
   */
  static async getPendingOrders(): Promise<Order[]> {
    return await apiClient.get<Order[]>(`${this.BASE_PATH}/pending`)
  }

  /**
   * Duyệt đơn hàng (admin only)
   */
  static async approveOrder(request: AdminApproveOrderRequest): Promise<Order> {
    return await apiClient.put<Order>(
      `${this.BASE_PATH}/${request.orderId}/approve`,
      {
        notes: request.notes
      }
    )
  }

  /**
   * Từ chối đơn hàng (admin only)
   */
  static async rejectOrder(request: AdminRejectOrderRequest): Promise<Order> {
    return await apiClient.put<Order>(
      `${this.BASE_PATH}/${request.orderId}/reject`,
      {
        reason: request.reason
      }
    )
  }

  /**
   * Kiểm tra quyền admin
   */
  static async checkAdminPermission(): Promise<boolean> {
    try {
      await apiClient.get('/api/admin/check')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Lấy thống kê nâng cao cho admin
   */
  static async getAdvancedStats(): Promise<any> {
    return await apiClient.get(`${this.BASE_PATH}/admin-stats`)
  }
}

export default AdminService