import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import OrderService from '../services/orderService'
import { formatVnd } from '../utils/format'
import type { Order, OrderStats, OrderFilters } from '../types/order'

// Interfaces cho filters mở rộng
interface ExtendedOrderFilters extends OrderFilters {
  customerEmail?: string
  minAmount?: number
  maxAmount?: number
  paymentStatus?: string
  shippingProvince?: string
  hasInvoice?: boolean
}

// Component OrderStatsCards
const OrderStatsCards: React.FC<{ stats: OrderStats | null }> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Tổng đơn hàng', value: stats.totalOrders, color: 'bg-blue-50 text-blue-600', icon: '📊' },
    { label: 'Chờ xử lý', value: stats.pendingOrders, color: 'bg-yellow-50 text-yellow-600', icon: '⏳' },
    { label: 'Đang giao', value: stats.shippingOrders, color: 'bg-orange-50 text-orange-600', icon: '🚚' },
    { label: 'Doanh thu', value: formatVnd(stats.totalRevenue), color: 'bg-green-50 text-green-600', icon: '💰' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Component OrderStatusBadge
const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusInfo = OrderService.getStatusInfo(status)
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  )
}

// Component AdvancedFilters
const AdvancedFilters: React.FC<{
  filters: ExtendedOrderFilters
  onFiltersChange: (filters: ExtendedOrderFilters) => void
  onExport: () => void
  onReset: () => void
}> = ({ filters, onFiltersChange, onExport, onReset }) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipping', label: 'Đang giao hàng' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'returned', label: 'Đã trả hàng' }
  ]

  const provinceOptions = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
    'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông'
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showAdvanced ? 'Ẩn bộ lọc nâng cao' : 'Hiển thị bộ lọc nâng cao'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Tìm kiếm cơ bản */}
        <input
          type="text"
          placeholder="Tìm theo mã đơn hàng..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Trạng thái */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Ngày bắt đầu */}
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Ngày kết thúc */}
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Bộ lọc nâng cao */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 pt-4 border-t border-gray-200">
          {/* Email khách hàng */}
          <input
            type="email"
            placeholder="Email khách hàng..."
            value={filters.customerEmail || ''}
            onChange={(e) => onFiltersChange({ ...filters, customerEmail: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Số tiền tối thiểu */}
          <input
            type="number"
            placeholder="Số tiền tối thiểu"
            value={filters.minAmount || ''}
            onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value ? Number(e.target.value) : undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Số tiền tối đa */}
          <input
            type="number"
            placeholder="Số tiền tối đa"
            value={filters.maxAmount || ''}
            onChange={(e) => onFiltersChange({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Tỉnh/Thành phố */}
          <select
            value={filters.shippingProvince || ''}
            onChange={(e) => onFiltersChange({ ...filters, shippingProvince: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả tỉnh/thành</option>
            {provinceOptions.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          {/* Có hóa đơn */}
          <select
            value={filters.hasInvoice?.toString() || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              hasInvoice: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả hóa đơn</option>
            <option value="true">Có hóa đơn</option>
            <option value="false">Chưa có hóa đơn</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onExport}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất Excel
        </button>

        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Đặt lại
        </button>

        <div className="ml-auto flex items-center text-sm text-gray-500">
          <span>Tìm thấy {0} đơn hàng</span>
        </div>
      </div>
    </div>
  )
}

const AdminOrdersList: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExtendedOrderFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  
  const pageSize = 20

  // Load dữ liệu với error handling an toàn
  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Chuyển đổi filters mở rộng thành OrderFilters chuẩn
      const apiFilters: OrderFilters = {
        status: filters.status,
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        customerId: filters.customerId
      }
      
      const response = await OrderService.getOrders(apiFilters, currentPage, pageSize)
      
      if (response && typeof response === 'object') {
        let filteredOrders = Array.isArray(response.orders) ? response.orders : []
        
        // Áp dụng filter phía client cho các thuộc tính mở rộng
        if (filters.customerEmail) {
          filteredOrders = filteredOrders.filter(order => 
            order.customer?.email?.toLowerCase().includes(filters.customerEmail!.toLowerCase())
          )
        }
        
        if (filters.minAmount || filters.maxAmount) {
          filteredOrders = filteredOrders.filter(order => {
            const total = order.total || 0
            if (filters.minAmount && total < filters.minAmount) return false
            if (filters.maxAmount && total > filters.maxAmount) return false
            return true
          })
        }
        
        if (filters.shippingProvince) {
          filteredOrders = filteredOrders.filter(order => 
            order.shippingAddress?.province === filters.shippingProvince
          )
        }
        
        if (filters.hasInvoice !== undefined) {
          filteredOrders = filteredOrders.filter(order => 
            Boolean(order.hasInvoice) === filters.hasInvoice
          )
        }
        
        setOrders(filteredOrders)
        setTotalPages(typeof response.totalPages === 'number' ? response.totalPages : 1)
        setTotalOrders(filteredOrders.length)
      } else {
        setOrders([])
        setTotalPages(1)
        setTotalOrders(0)
      }
    } catch (error: any) {
      console.error('Error loading orders:', error)
      setError(error?.message || 'Không thể tải danh sách đơn hàng')
      setOrders([])
      setTotalPages(1)
      setTotalOrders(0)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await OrderService.getOrderStats()
      if (statsData && typeof statsData === 'object') {
        setStats(statsData)
      }
    } catch (error: any) {
      console.error('Error loading stats:', error)
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        todayOrders: 0
      })
    }
  }

  useEffect(() => {
    loadOrders()
  }, [filters, currentPage])

  useEffect(() => {
    loadStats()
  }, [])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!orderId || !newStatus) {
      alert('❌ Thông tin không hợp lệ')
      return
    }

    // Find the order to get current status
    const order = orders.find(o => o.id === orderId)
    if (!order) {
      alert('❌ Không tìm thấy đơn hàng')
      return
    }

    // Check if the status is actually changing
    if (order.status === newStatus) {
      console.log('Status is the same, no need to update')
      return
    }

    // Validate if this transition is allowed
    const availableTransitions = OrderService.getAvailableStatusTransitions(order.status)
    if (!availableTransitions.some(status => status === newStatus)) {
      alert('❌ Không thể chuyển đổi trạng thái này')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng thành "${OrderService.getStatusInfo(newStatus).label}"?`)) {
      return
    }

    try {
      await OrderService.updateOrderStatus({ orderId, status: newStatus as any })
      alert('✅ Đã cập nhật trạng thái đơn hàng thành công')
      loadOrders()
      loadStats()
    } catch (error: any) {
      console.error('Error updating order status:', error)
      alert(`❌ ${error?.message || 'Không thể cập nhật trạng thái đơn hàng'}`)
    }
  }

  const handleFiltersChange = (newFilters: ExtendedOrderFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  // Hàm xuất Excel thực tế
  const handleExportExcel = async () => {
    try {
      // Tạo dữ liệu Excel
      const exportData = orders.map((order, index) => ({
        'STT': index + 1,
        'Mã đơn hàng': order.orderNumber || 'N/A',
        'Khách hàng': order.customer?.fullName || order.customer?.email || 'N/A',
        'Email': order.customer?.email || 'N/A',
        'Số điện thoại': order.customer?.phoneNumber || 'N/A',
        'Địa chỉ giao hàng': order.shippingAddress ? 
          `${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}` : 'N/A',
        'Tổng tiền': order.total || 0,
        'Trạng thái': OrderService.getStatusInfo(order.status || 'pending').label,
        'Có hóa đơn': order.hasInvoice ? 'Có' : 'Không',
        'Ngày tạo': order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        'Ngày cập nhật': order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('vi-VN') : 'N/A',
        'Ghi chú': order.notes || ''
      }))

      // Tạo file Excel đơn giản bằng CSV (có thể dùng thư viện như xlsx sau)
      const csvContent = [
        // Header
        Object.keys(exportData[0] || {}).join(','),
        // Data rows
        ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')

      // Tạo và tải file
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `don-hang-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('✅ File đã được xuất thành công!')
    } catch (error: any) {
      console.error('Error exporting orders:', error)
      alert(`❌ ${error?.message || 'Không thể xuất file'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="mt-2 text-gray-600">Theo dõi và quản lý tất cả đơn hàng của khách hàng</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <div className="flex items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <OrderStatsCards stats={stats} />

        {/* Advanced Filters */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={handleExportExcel}
          onReset={handleResetFilters}
        />

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order?.id || Math.random()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order?.orderNumber || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order?.items?.length || 0} sản phẩm</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order?.customer?.fullName || order?.customer?.email || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{order?.customer?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order?.items && order.items.length > 0 
                            ? `${order.items.slice(0, 2).map((item) => item?.productName || 'Sản phẩm').join(', ')}${order.items.length > 2 ? ` và ${order.items.length - 2} sản phẩm khác` : ''}`
                            : 'Không có sản phẩm'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatVnd(order?.total || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OrderStatusBadge status={order?.status || 'pending'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${OrderService.getPaymentStatusInfo(order?.paymentStatus || 'Pending').color}`}>
                          {OrderService.getPaymentStatusInfo(order?.paymentStatus || 'Pending').label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/orders/${order?.id}`)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Xem
                          </button>
                          <select
                            value={order?.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order?.id || 0, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!order?.id}
                          >
                            {/* Current status */}
                            <option value={order?.status || 'Pending'}>
                              {OrderService.getStatusInfo(order?.status || 'Pending').label}
                            </option>
                            {/* Available transitions */}
                            {OrderService.getAvailableStatusTransitions(order?.status || 'Pending').map((status) => {
                              const statusInfo = OrderService.getStatusInfo(status)
                              return (
                                <option key={status} value={status}>
                                  {statusInfo.label}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage}</span> của{' '}
                    <span className="font-medium">{totalPages}</span> ({totalOrders} đơn hàng)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminOrdersList
