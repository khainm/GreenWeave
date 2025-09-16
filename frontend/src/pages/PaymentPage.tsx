import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { OrderService } from '../services/orderService'
import { authService } from '../services/authService'
import type { Order } from '../types/order'

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setError(null)
        setLoading(true)

        // Check if user is authenticated
        const currentUser = authService.getUser()
        if (!currentUser) {
          navigate('/login', { replace: true })
          return
        }

        if (!orderId) {
          setError('ID đơn hàng không hợp lệ')
          return
        }

        const orderData = await OrderService.getOrderById(parseInt(orderId))
        if (!orderData) {
          setError('Không tìm thấy đơn hàng')
          return
        }

        setOrder(orderData)
      } catch (e: any) {
        console.error('Error loading order:', e)
        setError(e.message || 'Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, navigate])

  const handlePayment = async () => {
    if (!order) return

    try {
      setError(null)
      setSuccess(null)
      setPaying(true)

      const updatedOrder = await OrderService.payOrder(order.id)
      setOrder(updatedOrder)
      setSuccess('Thanh toán thành công!')

      // Redirect to order details after 2 seconds
      setTimeout(() => {
        navigate(`/orders/${order.id}`)
      }, 2000)

    } catch (e: any) {
      console.error('Error processing payment:', e)
      setError(e.message || 'Thanh toán thất bại. Vui lòng thử lại.')
    } finally {
      setPaying(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price)
  }

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

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-red-500">{error || 'Không tìm thấy đơn hàng'}</div>
          <button 
            onClick={() => navigate('/orders')} 
            className="mt-4 text-green-600 underline"
          >
            Quay lại danh sách đơn hàng
          </button>
        </main>
      </div>
    )
  }

  const isPaymentCompleted = order.paymentStatus === 'Paid'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isPaymentCompleted ? 'Thanh toán thành công!' : 'Thanh toán đơn hàng'}
            </h1>
            <p className="text-gray-600">
              Đơn hàng #{order.orderNumber}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {success}
            </div>
          )}

          {/* Order Summary */}
          <div className="border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đặt:</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${OrderService.getStatusInfo(order.status).color}`}>
                      {OrderService.getStatusInfo(order.status).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thanh toán:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${OrderService.getPaymentStatusInfo(order.paymentStatus).color}`}>
                      {OrderService.getPaymentStatusInfo(order.paymentStatus).label}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng:</span>
                    <span className="text-green-700">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="border rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Sản phẩm ({order.items.length})</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Actions */}
          <div className="text-center">
            {isPaymentCompleted ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center text-green-600 mb-4">
                  <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg font-semibold">Đã thanh toán thành công</span>
                </div>
                {order.paidAt && (
                  <p className="text-gray-600">
                    Thanh toán lúc: {new Date(order.paidAt).toLocaleString('vi-VN')}
                  </p>
                )}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                  >
                    Xem đơn hàng khác
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  Đơn hàng của bạn đã được đặt thành công. Vui lòng thanh toán để hoàn tất quá trình đặt hàng.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-yellow-800">
                    <strong>Lưu ý:</strong> Đây là thanh toán mô phỏng. Trong thực tế, bạn sẽ được chuyển đến cổng thanh toán an toàn.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    disabled={paying}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Thanh toán sau
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={paying}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {paying ? 'Đang xử lý...' : `Thanh toán ${formatPrice(order.total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PaymentPage