export interface Staff {
  id: string
  customerCode: string
  email: string
  fullName: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  avatar?: string
  createdAt: string
  isActive: boolean
  roles: string[]
}

export interface StaffFilters {
  search?: string
  role?: 'Admin' | 'Staff'
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface StaffListResponse {
  data: Staff[]
  total: number
  page: number
  pageSize: number
}

export interface CreateStaffRequest {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  role: 'Admin' | 'Staff'
}

export interface UpdateStaffRoleRequest {
  staffId: string
  role: 'Admin' | 'Staff'
}

export interface StaffStats {
  totalStaff: number
  activeStaff: number
  adminCount: number
  staffCount: number
  newStaffThisMonth: number
}

export interface StaffWithActivity extends Staff {
  lastLoginDate?: string
  ordersHandled?: number
  customersManaged?: number
  activityLog?: Array<{
    id: string
    action: string
    details: string
    timestamp: string
  }>
}