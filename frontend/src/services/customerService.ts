import { apiClient } from './apiClient'
import type { 
  Customer, 
  CustomerFilters, 
  CustomerListResponse, 
  CreateCustomerRequest, 
  UpdateCustomerRoleRequest,
  CustomerWithOrders,
  CustomerStats,
  ApiResponse
} from '../types/customer'

export class CustomerService {
  private static readonly BASE_PATH = '/api/admin/adminusers'

  /**
   * Lấy danh sách tất cả khách hàng (chỉ role Customer)
   */
  static async getAllCustomers(): Promise<Customer[]> {
    return await apiClient.get<Customer[]>(`${this.BASE_PATH}/by-role/Customer`)
  }

  /**
   * Lấy danh sách khách hàng theo role 
   */
  static async getCustomersByRole(role: string): Promise<Customer[]> {
    return await apiClient.get<Customer[]>(`${this.BASE_PATH}/by-role/${role}`)
  }

  /**
   * Tìm khách hàng theo customer code
   */
  static async getCustomerByCode(customerCode: string): Promise<Customer> {
    return await apiClient.get<Customer>(`${this.BASE_PATH}/customer-code/${customerCode}`)
  }

  /**
   * Lấy chi tiết khách hàng kèm lịch sử đơn hàng
   */
  static async getCustomerDetail(customerId: string): Promise<CustomerWithOrders> {
    // Lấy thông tin khách hàng
    const customer = await apiClient.get<Customer>(`${this.BASE_PATH}/customer-code/${customerId}`)
    
    // Lấy lịch sử đơn hàng của khách hàng này
    const orders = await apiClient.get<any[]>(`/api/orders?customerId=${customer.id}`)
    
    // Tính toán thống kê
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
    const lastOrderDate = orders.length > 0 
      ? orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : undefined

    return {
      ...customer,
      totalOrders,
      totalSpent,
      lastOrderDate,
      orders: orders.map((order: any) => ({
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      }))
    }
  }

  /**
   * Tạo khách hàng mới
   */
  static async createCustomer(request: CreateCustomerRequest): Promise<ApiResponse<Customer>> {
    return await apiClient.post<ApiResponse<Customer>>(`${this.BASE_PATH}/create`, request)
  }

  /**
   * Cập nhật role của khách hàng
   */
  static async updateCustomerRole(request: UpdateCustomerRoleRequest): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(
      `${this.BASE_PATH}/${request.customerId}/role`, 
      { role: request.role }
    )
  }

  /**
   * Vô hiệu hóa khách hàng
   */
  static async deactivateCustomer(customerId: string): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(`${this.BASE_PATH}/${customerId}/deactivate`, {})
  }

  /**
   * Kích hoạt lại khách hàng
   */
  static async activateCustomer(customerId: string): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(`${this.BASE_PATH}/${customerId}/activate`, {})
  }

  /**
   * Lấy roles của khách hàng
   */
  static async getCustomerRoles(customerId: string): Promise<string[]> {
    return await apiClient.get<string[]>(`${this.BASE_PATH}/${customerId}/roles`)
  }

  /**
   * Tìm kiếm và lọc khách hàng (client-side filtering)
   */
  static async searchCustomers(filters: CustomerFilters): Promise<CustomerListResponse> {
    let customers = await this.getAllCustomers()

    // Lọc theo tìm kiếm
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      customers = customers.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.customerCode.toLowerCase().includes(searchTerm) ||
        customer.phoneNumber?.toLowerCase().includes(searchTerm)
      )
    }

    // Lọc theo trạng thái active
    if (filters.isActive !== undefined) {
      customers = customers.filter(customer => customer.isActive === filters.isActive)
    }

    // Lọc theo ngày tạo
    if (filters.dateFrom) {
      customers = customers.filter(customer => 
        new Date(customer.createdAt) >= new Date(filters.dateFrom!)
      )
    }

    if (filters.dateTo) {
      customers = customers.filter(customer => 
        new Date(customer.createdAt) <= new Date(filters.dateTo!)
      )
    }

    return {
      data: customers,
      total: customers.length,
      page: 1,
      pageSize: customers.length
    }
  }

  /**
   * Lấy thống kê khách hàng
   */
  static async getCustomerStats(): Promise<CustomerStats> {
    const customers = await this.getAllCustomers()
    const activeCustomers = customers.filter(c => c.isActive).length
    
    // Khách hàng mới trong tháng
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newCustomersThisMonth = customers.filter(c => 
      new Date(c.createdAt) >= thisMonth
    ).length

    // TODO: Lấy từ order service thực tế
    const totalOrders = 0
    const totalRevenue = 0

    return {
      totalCustomers: customers.length,
      activeCustomers,
      newCustomersThisMonth,
      totalOrders,
      totalRevenue
    }
  }
}