import { apiClient } from './apiClient'
import type { 
  Staff, 
  StaffFilters, 
  StaffListResponse, 
  CreateStaffRequest, 
  UpdateStaffRoleRequest,
  StaffWithActivity,
  StaffStats
} from '../types/staff'
import type { ApiResponse } from '../types/customer'

export class StaffService {
  private static readonly BASE_PATH = '/api/admin/adminusers'

  /**
   * Lấy danh sách nhân viên (Admin + Staff roles)
   */
  static async getAllStaff(): Promise<Staff[]> {
    const [admins, staff] = await Promise.all([
      apiClient.get<Staff[]>(`${this.BASE_PATH}/by-role/Admin`),
      apiClient.get<Staff[]>(`${this.BASE_PATH}/by-role/Staff`)
    ])
    return [...admins, ...staff]
  }

  /**
   * Lấy danh sách theo role cụ thể
   */
  static async getStaffByRole(role: 'Admin' | 'Staff'): Promise<Staff[]> {
    return await apiClient.get<Staff[]>(`${this.BASE_PATH}/by-role/${role}`)
  }

  /**
   * Tìm nhân viên theo staff code
   */
  static async getStaffByCode(staffCode: string): Promise<Staff> {
    return await apiClient.get<Staff>(`${this.BASE_PATH}/customer-code/${staffCode}`)
  }

  /**
   * Lấy chi tiết nhân viên kèm hoạt động
   */
  static async getStaffDetail(staffId: string): Promise<StaffWithActivity> {
    // Lấy thông tin nhân viên
    const staff = await apiClient.get<Staff>(`${this.BASE_PATH}/customer-code/${staffId}`)
    
    // TODO: Lấy thêm thông tin hoạt động từ các API khác
    const lastLoginDate = undefined // Từ auth logs
    const ordersHandled = 0 // Từ orders API  
    const customersManaged = 0 // Từ customer interactions
    const activityLog: any[] = [] // Từ activity logs

    return {
      ...staff,
      lastLoginDate,
      ordersHandled,
      customersManaged,
      activityLog
    }
  }

  /**
   * Tạo nhân viên mới
   */
  static async createStaff(request: CreateStaffRequest): Promise<ApiResponse<Staff>> {
    return await apiClient.post<ApiResponse<Staff>>(`${this.BASE_PATH}/create`, request)
  }

  /**
   * Cập nhật role của nhân viên
   */
  static async updateStaffRole(request: UpdateStaffRoleRequest): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(
      `${this.BASE_PATH}/${request.staffId}/role`, 
      { role: request.role }
    )
  }

  /**
   * Vô hiệu hóa nhân viên
   */
  static async deactivateStaff(staffId: string): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(`${this.BASE_PATH}/${staffId}/deactivate`, {})
  }

  /**
   * Kích hoạt lại nhân viên
   */
  static async activateStaff(staffId: string): Promise<ApiResponse<any>> {
    return await apiClient.put<ApiResponse<any>>(`${this.BASE_PATH}/${staffId}/activate`, {})
  }

  /**
   * Lấy roles của nhân viên
   */
  static async getStaffRoles(staffId: string): Promise<string[]> {
    return await apiClient.get<string[]>(`${this.BASE_PATH}/${staffId}/roles`)
  }

  /**
   * Tìm kiếm và lọc nhân viên
   */
  static async searchStaff(filters: StaffFilters): Promise<StaffListResponse> {
    let staff = await this.getAllStaff()

    // Lọc theo tìm kiếm
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      staff = staff.filter(s => 
        s.fullName.toLowerCase().includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm) ||
        s.customerCode.toLowerCase().includes(searchTerm) ||
        s.phoneNumber?.toLowerCase().includes(searchTerm)
      )
    }

    // Lọc theo role
    if (filters.role) {
      staff = staff.filter(s => s.roles.includes(filters.role!))
    }

    // Lọc theo trạng thái active
    if (filters.isActive !== undefined) {
      staff = staff.filter(s => s.isActive === filters.isActive)
    }

    // Lọc theo ngày tạo
    if (filters.dateFrom) {
      staff = staff.filter(s => 
        new Date(s.createdAt) >= new Date(filters.dateFrom!)
      )
    }

    if (filters.dateTo) {
      staff = staff.filter(s => 
        new Date(s.createdAt) <= new Date(filters.dateTo!)
      )
    }

    return {
      data: staff,
      total: staff.length,
      page: 1,
      pageSize: staff.length
    }
  }

  /**
   * Lấy thống kê nhân viên
   */
  static async getStaffStats(): Promise<StaffStats> {
    const staff = await this.getAllStaff()
    const activeStaff = staff.filter(s => s.isActive).length
    const adminCount = staff.filter(s => s.roles.includes('Admin')).length
    const staffCount = staff.filter(s => s.roles.includes('Staff')).length
    
    // Nhân viên mới trong tháng
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const newStaffThisMonth = staff.filter(s => 
      new Date(s.createdAt) >= thisMonth
    ).length

    return {
      totalStaff: staff.length,
      activeStaff,
      adminCount,
      staffCount,
      newStaffThisMonth
    }
  }
}