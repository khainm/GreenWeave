import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { OrderService } from '../services/orderService'
import { formatVnd } from '../utils/format'
import type { Order } from '../types/order'
import { useAuth } from '../contexts/AuthContext'

const MyOrdersPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadMyOrders()
  }, [filter])

  const loadMyOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the dedicated getMyOrders method
      const response = await OrderService.getMyOrders(filter, 1, 100)
      setOrders(response.orders || [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return OrderService.getStatusInfo(status as any)
  }

  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h1>
            <Link to="/login" className="text-green-600 hover:text-green-700 underline">
              Đăng nhập ngay
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="mt-2 text-gray-600">Theo dõi và quản lý các đơn hàng của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Tất cả', count: orders.length },
                { key: 'Pending', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'Pending').length },
                { key: 'Confirmed', label: 'Đã xác nhận', count: orders.filter(o => o.status === 'Confirmed').length },
                { key: 'Shipping', label: 'Đang giao', count: orders.filter(o => o.status === 'Shipping').length },
                { key: 'Delivered', label: 'Đã giao', count: orders.filter(o => o.status === 'Delivered').length },
                { key: 'Cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'Cancelled').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`${
                    filter === tab.key
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadMyOrders}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${getFilterLabel(filter)}`}
            </h3>
            <p className="text-gray-600 mb-4">Bắt đầu mua sắm để tạo đơn hàng đầu tiên của bạn!</p>
            <Link
              to="/products"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Đơn hàng #{order.orderNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(order.status).color}`}>
                        {getStatusInfo(order.status).label}
                      </span>
                      {order.paymentStatus && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${OrderService.getPaymentStatusInfo(order.paymentStatus).color}`}>
                          {OrderService.getPaymentStatusInfo(order.paymentStatus).label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Products Preview */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={index} className="relative">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg border-2 border-white object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">IMG</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items && order.items.length > 3 && (
                            <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{order.items.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {order.items?.length || 0} sản phẩm
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items && order.items.length > 0 
                              ? order.items[0].productName + (order.items.length > 1 ? ` và ${order.items.length - 1} sản phẩm khác` : '')
                              : 'Không có sản phẩm'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="text-sm text-gray-600">
                        <p>Giao đến: {order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.address}, {order.shippingAddress?.district}, {order.shippingAddress?.province}</p>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        {formatVnd(order.total)}
                      </div>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4">
                        {order.paymentStatus === 'Pending' && (
                          <button 
                            onClick={() => navigate(`/payment/${order.id}`)}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Thanh toán ngay
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <button className="text-sm text-green-600 hover:text-green-700">
                            Đánh giá sản phẩm
                          </button>
                        )}
                        {(order.status === 'Pending' || order.status === 'Confirmed') && (
                          <button className="text-sm text-red-600 hover:text-red-700">
                            Hủy đơn hàng
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewOrder(order.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Theo dõi đơn hàng
                        </button>
                      </div>
                      {order.hasInvoice && (
                        <button className="text-sm text-gray-600 hover:text-gray-700">
                          Tải hóa đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function to get filter label
const getFilterLabel = (filter: string) => {
  const labels: { [key: string]: string } = {
    Pending: 'chờ xác nhận',
    Confirmed: 'đã xác nhận',
    Shipping: 'đang giao',
    Delivered: 'đã giao',
    Cancelled: 'đã hủy'
  }
  return labels[filter] || filter
}

export default MyOrdersPage