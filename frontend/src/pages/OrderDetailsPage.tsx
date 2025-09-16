import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import { OrderService } from '../services/orderService'
import type { Order } from '../types/order'

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return
      
      try {
        setError(null)
        setLoading(true)
        const orderData = await OrderService.getOrderById(parseInt(id))
        setOrder(orderData)
      } catch (e: any) {
        console.error('Error loading order:', e)
        setError('Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-gray-500">Đang tải...</div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error || 'Không tìm thấy đơn hàng'}</div>
            <Link to="/" className="text-green-600 underline">Về trang chủ</Link>
          </div>
        </main>
      </div>
    )
  }

  const statusInfo = OrderService.getStatusInfo(order.status)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Chi tiết đơn hàng #{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {order.status === 'Pending' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="text-green-600 text-2xl mr-3">✅</div>
              <div>
                <div className="font-semibold text-green-900">Đặt hàng thành công!</div>
                <div className="text-green-700">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xác nhận đơn hàng trong thời gian sớm nhất.</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Info */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.productSku}</div>
                      <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
              <div>
                <div className="font-medium">{order.shippingAddress?.fullName}</div>
                <div className="text-sm text-gray-600">{order.shippingAddress?.phoneNumber}</div>
                <div className="text-sm text-gray-600">
                  {order.shippingAddress?.address}, {order.shippingAddress?.ward && `${order.shippingAddress.ward}, `}
                  {order.shippingAddress?.district}, {order.shippingAddress?.province}
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-6 h-max">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Giảm giá</span>
                  <span className="text-red-600">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Tổng cộng</span>
                <span className="text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-500">
              <div>Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
              {order.confirmedAt && (
                <div>Ngày xác nhận: {new Date(order.confirmedAt).toLocaleDateString('vi-VN')}</div>
              )}
              {order.shippedAt && (
                <div>Ngày giao hàng: {new Date(order.shippedAt).toLocaleDateString('vi-VN')}</div>
              )}
              {order.deliveredAt && (
                <div>Ngày nhận hàng: {new Date(order.deliveredAt).toLocaleDateString('vi-VN')}</div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Link 
                to="/products" 
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Tiếp tục mua sắm
              </Link>
              <Link 
                to="/orders" 
                className="block w-full text-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold"
              >
                Xem đơn hàng của tôi
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderDetailsPage