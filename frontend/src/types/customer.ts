export interface Customer {
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

export interface CustomerFilters {
  search?: string
  isActive?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface CustomerListResponse {
  data: Customer[]
  total: number
  page: number
  pageSize: number
}

export interface CreateCustomerRequest {
  email: string
  fullName: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  password: string
}

export interface UpdateCustomerRoleRequest {
  customerId: string
  role: string
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  totalOrders: number
  totalRevenue: number
}

export interface CustomerWithOrders extends Customer {
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  orders?: Array<{
    id: number
    orderCode: string
    totalAmount: number
    status: string
    paymentStatus: string
    createdAt: string
  }>
}