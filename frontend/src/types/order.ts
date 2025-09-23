export interface OrderItem {
  id: number
  orderId: number
  productId: number
  productName: string
  productSku: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customization?: {
    color?: string
    stickers?: Array<{
      id: number
      imageUrl: string
      x: number
      y: number
      scale: number
    }>
    designPreview?: string
  }
}

export interface UserInfo {
  id: number
  email: string
  fullName?: string
  phoneNumber?: string
}

export interface ShippingAddress {
  id: number
  fullName: string
  phoneNumber: string
  address: string
  ward: string
  district: string
  province: string
  isDefault: boolean
}

export type OrderStatus = 
  | 'Pending'      // Chờ xác nhận
  | 'Confirmed'    // Đã xác nhận
  | 'Processing'   // Đang xử lý
  | 'Shipping'     // Đang giao hàng
  | 'Delivered'    // Đã giao hàng
  | 'Cancelled'    // Đã hủy
  | 'Returned'     // Đã trả hàng

export type PaymentStatus = 
  | 'Pending'      // Chưa thanh toán
  | 'Paid'         // Đã thanh toán
  | 'Failed'       // Thanh toán thất bại
  | 'Refunded'     // Đã hoàn tiền

export type PaymentMethod = 
  | 'CashOnDelivery'  // Thanh toán khi nhận hàng (COD)
  | 'BankTransfer'    // Thanh toán chuyển khoản

export interface Order {
  id: number
  orderNumber: string
  customerId: number
  customer: UserInfo
  shippingAddress: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancelReason?: string
  // Shipping-related fields
  shippingProvider: string
  shippingCode?: string
  shippingStatus?: string
  shippingHistory?: Array<{
    timestamp: string;
    status: string;
    description: string;
    location?: string;
  }>
  // Invoice-related fields
  hasInvoice?: boolean
  invoiceId?: number
  invoiceNumber?: string
  invoiceStatus?: 'generated' | 'sent' | 'error'
}

export interface OrderFilters {
  status?: OrderStatus
  search?: string // Tìm theo order number, customer name, email
  dateFrom?: string
  dateTo?: string
  customerId?: number
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UpdateOrderStatusRequest {
  orderId: number
  status: OrderStatus
  notes?: string
}

export interface CreateOrderRequest {
  customerId: string // Backend expects string ID from JWT
  shippingAddressId: string // Backend expects Guid as string
  items: Array<{
    productId: number
    quantity: number
    unitPrice: number
    customization?: {
      color?: string
      stickers?: Array<{
        id: number
        imageUrl: string
        x: number
        y: number
        scale: number
      }>
      designPreview?: string
    }
  }>
  shippingFee?: number
  discount?: number
  notes?: string
  paymentMethod?: PaymentMethod
}

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippingOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
  todayOrders: number
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  success: boolean
}