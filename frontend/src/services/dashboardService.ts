import { apiClient } from './apiClient'
import { OrderService } from './orderService'
import { CustomerService } from './customerService'
import { StaffService } from './staffService'

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalStaff: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  staffGrowth: number
}

export interface DashboardActivity {
  id: string
  type: 'order' | 'customer' | 'staff' | 'product'
  title: string
  description: string
  timestamp: string
  user: string
  value?: string
}

export interface DashboardRevenueData {
  date: string
  revenue: number
}

export class DashboardService {
  private static readonly BASE_PATH = '/api/dashboard'

  /**
   * Lấy thống kê tổng quan dashboard
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Lấy dữ liệu từ các service khác nhau
      const [orderStats, customerStats, staffStats] = await Promise.all([
        OrderService.getOrderStats(),
        CustomerService.getCustomerStats(),
        StaffService.getStaffStats()
      ])

      // Tính toán growth (so với tháng trước)
      const currentMonth = new Date()
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      // Mock growth calculation - trong thực tế sẽ lấy từ API
      const revenueGrowth = Math.random() * 20 - 5 // -5% to +15%
      const ordersGrowth = Math.random() * 15 - 3 // -3% to +12%
      const customersGrowth = Math.random() * 25 - 5 // -5% to +20%
      const staffGrowth = Math.random() * 10 - 2 // -2% to +8%

      return {
        totalRevenue: orderStats.totalRevenue || 0,
        totalOrders: orderStats.totalOrders || 0,
        totalCustomers: customerStats.totalCustomers || 0,
        totalStaff: staffStats.totalStaff || 0,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        customersGrowth: Math.round(customersGrowth * 10) / 10,
        staffGrowth: Math.round(staffGrowth * 10) / 10
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      // Return default values if API fails
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalStaff: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0,
        staffGrowth: 0
      }
    }
  }

  /**
   * Lấy dữ liệu doanh thu theo thời gian
   */
  static async getRevenueData(period: 'day' | 'week' | 'month' = 'day'): Promise<DashboardRevenueData[]> {
    try {
      const response = await apiClient.get<DashboardRevenueData[]>(`${this.BASE_PATH}/revenue?period=${period}`)
      return response
    } catch (error) {
      console.error('Error getting revenue data:', error)
      // Return mock data if API fails
      return this.getMockRevenueData(period)
    }
  }

  /**
   * Lấy hoạt động gần đây
   */
  static async getRecentActivities(): Promise<DashboardActivity[]> {
    try {
      const response = await apiClient.get<DashboardActivity[]>(`${this.BASE_PATH}/activities`)
      return response
    } catch (error) {
      console.error('Error getting recent activities:', error)
      // Return mock data if API fails
      return this.getMockActivities()
    }
  }

  /**
   * Mock revenue data khi API không có sẵn
   */
  private static getMockRevenueData(period: 'day' | 'week' | 'month'): DashboardRevenueData[] {
    const data: DashboardRevenueData[] = []
    const now = new Date()
    
    if (period === 'day') {
      // 24 giờ
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now)
        date.setHours(date.getHours() - i)
        data.push({
          date: date.toISOString(),
          revenue: Math.floor(Math.random() * 50000) + 10000
        })
      }
    } else if (period === 'week') {
      // 7 ngày
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        data.push({
          date: date.toISOString(),
          revenue: Math.floor(Math.random() * 200000) + 50000
        })
      }
    } else {
      // 30 ngày
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        data.push({
          date: date.toISOString(),
          revenue: Math.floor(Math.random() * 300000) + 100000
        })
      }
    }
    
    return data
  }

  /**
   * Mock activities data khi API không có sẵn
   */
  private static getMockActivities(): DashboardActivity[] {
    const activities: DashboardActivity[] = [
      {
        id: '1',
        type: 'order',
        title: 'Đơn hàng mới',
        description: 'Đơn hàng #GW20250115001 đã được tạo',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 phút trước
        user: 'Nguyễn Thị Hoa',
        value: '159,200đ'
      },
      {
        id: '2',
        type: 'customer',
        title: 'Khách hàng mới',
        description: 'Khách hàng mới đã đăng ký',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
        user: 'Trần Văn Nam',
        value: undefined
      },
      {
        id: '3',
        type: 'order',
        title: 'Đơn hàng hoàn thành',
        description: 'Đơn hàng #GW20250114005 đã được giao thành công',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 giờ trước
        user: 'Lê Thị Mai',
        value: '245,000đ'
      },
      {
        id: '4',
        type: 'staff',
        title: 'Nhân viên mới',
        description: 'Nhân viên mới đã được thêm vào hệ thống',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 giờ trước
        user: 'Phạm Văn Đức',
        value: undefined
      },
      {
        id: '5',
        type: 'order',
        title: 'Đơn hàng hủy',
        description: 'Đơn hàng #GW20250113002 đã bị hủy',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 giờ trước
        user: 'Nguyễn Văn A',
        value: '89,500đ'
      }
    ]

    return activities
  }
}

export default DashboardService
