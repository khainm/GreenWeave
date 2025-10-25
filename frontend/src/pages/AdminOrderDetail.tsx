import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import OrderService from '../services/orderService'
import { formatVnd } from '../utils/format'
import type { Order } from '../types/order'

const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      loadOrderDetail()
    }
  }, [id])

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderData = await OrderService.getOrderById(parseInt(id!))
      setOrder(orderData)
    } catch (err) {
      console.error('Error loading order detail:', err)
      setError('Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order?.id || !newStatus) return

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
      setUpdating(true)
      await OrderService.updateOrderStatus({
        orderId: order.id,
        status: newStatus as any
      })
      setOrder(prev => prev ? { ...prev, status: newStatus as any } : null)
      alert('✅ Đã cập nhật trạng thái đơn hàng thành công')
    } catch (err) {
      console.error('Error updating status:', err)
      alert('❌ Không thể cập nhật trạng thái đơn hàng')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return OrderService.getStatusInfo(status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
            <span>Đang tải...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lỗi</h2>
            <p className="text-gray-600 mb-4">{error || 'Không tìm thấy đơn hàng'}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                ← Quay lại danh sách đơn hàng
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Chi tiết đơn hàng #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Đặt hàng ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(order.status).color}`}>
                {getStatusInfo(order.status).label}
              </span>
              {order.paymentStatus && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${OrderService.getPaymentStatusInfo(order.paymentStatus).color}`}>
                  {OrderService.getPaymentStatusInfo(order.paymentStatus).label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đặt hàng</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      {item.customization?.color && (
                        <p className="text-sm text-gray-600">Màu: {item.customization.color}</p>
                      )}
                      {item.customization && (
                        <p className="text-sm text-gray-600">
                          Tùy chỉnh: {item.customization.color ? `Màu ${item.customization.color}` : ''} 
                          {item.customization.stickers?.length ? ` (${item.customization.stickers.length} sticker)` : ''}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity} × {formatVnd(item.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatVnd(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{formatVnd(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span>{formatVnd(order.shippingFee || 0)}</span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatVnd(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span>{formatVnd(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h2>
              <div className="space-y-2">
                <p className="font-medium">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-600">{order.shippingAddress?.phoneNumber}</p>
                <p className="text-gray-600">
                  {order.shippingAddress?.addressLine || order.shippingAddress?.addressDetail || 'Chưa có địa chỉ chi tiết'}, {order.shippingAddress?.ward || 'Chưa có phường/xã'}, {order.shippingAddress?.district || 'Chưa có quận/huyện'}, {order.shippingAddress?.province || 'Chưa có tỉnh/thành phố'}
                </p>
                {order.notes && (
                  <p className="text-gray-600 italic">Ghi chú: {order.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tên khách hàng</p>
                  <p className="font-medium">{order.customer?.fullName || order.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.customer?.email}</p>
                </div>
                {order.customer?.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-medium">{order.customer.phoneNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin thanh toán</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                  <p className="font-medium">Thanh toán khi nhận hàng</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${OrderService.getPaymentStatusInfo(order.paymentStatus || 'Pending').color}`}>
                    {OrderService.getPaymentStatusInfo(order.paymentStatus || 'Pending').label}
                  </span>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-sm text-gray-600">Thời gian thanh toán</p>
                    <p className="font-medium">{new Date(order.paidAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quản lý trạng thái</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái hiện tại
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Current status */}
                    <option value={order.status}>
                      {getStatusInfo(order.status).label} (Hiện tại)
                    </option>
                    {/* Available transitions */}
                    {OrderService.getAvailableStatusTransitions(order.status).map((status) => {
                      const statusInfo = getStatusInfo(status)
                      return (
                        <option key={status} value={status}>
                          {statusInfo.label}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {updating && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Đang cập nhật...
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin thanh toán</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                  <p className="font-medium">Thanh toán khi nhận hàng</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
                  <p className="font-medium text-yellow-600">Chờ thanh toán</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOrderDetail