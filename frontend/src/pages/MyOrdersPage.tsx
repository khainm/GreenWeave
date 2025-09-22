import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import ShippingStatusBadge from '../components/shipping/ShippingStatusBadge';
import type { Order } from '../types';
import OrderService from '../services/orderService';
import { 
  ClockIcon, 
  TruckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

const MyOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ordersData = await OrderService.getMyOrders();
      setOrders(ordersData.orders || []);
      
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'shipping':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'shipping':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter;
  });

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status.toLowerCase() === 'pending').length,
      confirmed: orders.filter(o => o.status.toLowerCase() === 'confirmed').length,
      shipping: orders.filter(o => o.status.toLowerCase() === 'shipping').length,
      delivered: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
      cancelled: orders.filter(o => o.status.toLowerCase() === 'cancelled').length,
    };
  };

  const orderCounts = getOrderCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Đơn hàng của tôi</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
              <button 
                onClick={loadOrders}
                className="ml-2 underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Tất cả', count: orderCounts.all },
                { key: 'pending', label: 'Chờ xác nhận', count: orderCounts.pending },
                { key: 'confirmed', label: 'Đã xác nhận', count: orderCounts.confirmed },
                { key: 'shipping', label: 'Đang giao', count: orderCounts.shipping },
                { key: 'delivered', label: 'Đã giao', count: orderCounts.delivered },
                { key: 'cancelled', label: 'Đã hủy', count: orderCounts.cancelled },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`
                    whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${filter === key
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {label} {count > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-900 rounded-full px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${getStatusText(filter)}`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Bạn chưa đặt đơn hàng nào. Hãy khám phá các sản phẩm của chúng tôi!'
                : 'Không tìm thấy đơn hàng nào với trạng thái này.'
              }
            </p>
            {filter === 'all' && (
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Mua sắm ngay
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Đơn hàng #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {order.total.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.productImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.items.length} sản phẩm
                    </p>
                  </div>

                  {/* Shipping info */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Vận chuyển: {order.shippingProvider}
                        </p>
                        {order.shippingCode && (
                          <p className="text-sm text-gray-600">
                            Mã vận đơn: {order.shippingCode}
                          </p>
                        )}
                      </div>
                      
                      {order.shippingStatus && (
                        <ShippingStatusBadge status={order.shippingStatus} />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Chi tiết
                      </Link>
                      
                      {order.shippingCode && order.shippingStatus !== 'Delivered' && order.shippingStatus !== 'Cancelled' && (
                        <Link
                          to={`/orders/${order.id}#tracking`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <TruckIcon className="w-4 h-4 mr-1" />
                          Theo dõi
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more button (if needed for pagination) */}
        {filteredOrders.length > 0 && filteredOrders.length % 20 === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadOrders}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Tải thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;