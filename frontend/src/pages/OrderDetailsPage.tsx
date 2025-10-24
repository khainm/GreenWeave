import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import ShippingStatusBadge from '../components/shipping/ShippingStatusBadge';
import TrackingTimeline from '../components/shipping/TrackingTimeline';
import type { Order, TrackingInfo } from '../types';
import OrderService from '../services/orderService';
import ShippingService from '../services/shippingService';
import { 
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'order' | 'tracking'>('order');

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    if (!id) {
      navigate('/orders');
      return;
    }

    loadOrderDetails();
    
    // Auto-switch to tracking tab if URL hash is present
    if (location.hash === '#tracking') {
      setActiveTab('tracking');
    }
  }, [id, user, navigate, location]);

  useEffect(() => {
    if (order && order.shippingCode && activeTab === 'tracking') {
      loadTrackingInfo();
    }
  }, [order, activeTab]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = await OrderService.getOrderById(parseInt(id!));
      setOrder(orderData);
      
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy đơn hàng');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền xem đơn hàng này');
      } else {
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      }
      console.error('Error loading order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingInfo = async () => {
    if (!order?.shippingCode) return;

    try {
      setTrackingLoading(true);
      const trackingData = await ShippingService.getTracking(order.id);
      setTracking(trackingData);
    } catch (err: any) {
      console.error('Error loading tracking info:', err);
      // Don't show error for tracking, just log it
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <CheckCircleIcon className="w-6 h-6 text-blue-500" />;
      case 'shipping':
        return <TruckIcon className="w-6 h-6 text-blue-500" />;
      case 'delivered':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
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

  const getPaymentStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chưa thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h1 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Không tìm thấy đơn hàng'}
            </h1>
            <button
              onClick={() => navigate('/orders')}
              className="text-green-600 hover:text-green-700 underline"
            >
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại danh sách đơn hàng
        </button>

        {/* Success message */}
        {location.state?.message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {location.state.message}
          </div>
        )}

        {/* Order header */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đơn hàng #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(order.status)}
                <span className="text-lg font-medium text-gray-900">
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {getPaymentStatusText(order.paymentStatus)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('order')}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'order'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                Thông tin đơn hàng
              </button>
              
              {order.shippingCode && (
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`
                    whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'tracking'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <TruckIcon className="w-4 h-4 inline mr-1" />
                  Theo dõi vận chuyển
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'order' ? (
          <div className="space-y-6">
            {/* Order items */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.productImage || '/placeholder-product.jpg'}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity} × {item.unitPrice.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {item.totalPrice.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {order.shippingFee > 0 
                      ? `${order.shippingFee.toLocaleString('vi-VN')}đ`
                      : 'Miễn phí'
                    }
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{order.discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600">{order.total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Người nhận
                  </h3>
                  <p className="text-gray-600">{order.shippingAddress.name}</p>
                  <p className="text-gray-600 flex items-center mt-1">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    {order.shippingAddress.phone}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Địa chỉ giao hàng
                  </h3>
                  <p className="text-gray-600">
                    {order.shippingAddress.addressDetail}
                    {order.shippingAddress.ward && `, ${order.shippingAddress.ward}`}
                    , {order.shippingAddress.district}, {order.shippingAddress.province}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Thông tin vận chuyển</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Đơn vị vận chuyển</h3>
                  <p className="text-gray-600">
                    {order.shippingProvider}
                  </p>
                  {order.shippingCode && (
                    <>
                      <h3 className="font-medium text-gray-900 mb-2 mt-4">Mã vận đơn</h3>
                      <p className="text-gray-600 font-mono">{order.shippingCode}</p>
                    </>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Trạng thái vận chuyển</h3>
                  {order.shippingStatus ? (
                    <ShippingStatusBadge status={order.shippingStatus} />
                  ) : (
                    <span className="text-gray-500">Chưa có thông tin</span>
                  )}
                </div>
              </div>
            </div>

            {/* Order notes */}
            {order.notes && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Ghi chú đơn hàng</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        ) : (
          /* Tracking tab */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Theo dõi vận chuyển</h2>
                <button
                  onClick={loadTrackingInfo}
                  disabled={trackingLoading}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  {trackingLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>

              {order.shippingCode ? (
                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mã vận đơn</p>
                        <p className="text-sm text-gray-600 font-mono">{order.shippingCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Đơn vị vận chuyển</p>
                        <p className="text-sm text-gray-600">
                          {order.shippingProvider}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Trạng thái</p>
                        {order.shippingStatus && <ShippingStatusBadge status={order.shippingStatus} />}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Chưa có thông tin vận chuyển</p>
                  <p className="text-sm text-gray-500">Đơn hàng đang được xử lý</p>
                </div>
              )}

              {trackingLoading ? (
                <div className="animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ) : tracking ? (
                <TrackingTimeline 
                  events={tracking.events} 
                  currentStatus={tracking.status}
                />
              ) : order.shippingHistory && order.shippingHistory.length > 0 ? (
                <TrackingTimeline 
                  events={order.shippingHistory} 
                  currentStatus={order.shippingStatus || ''}
                />
              ) : order.shippingCode ? (
                <div className="text-center py-8 text-gray-500">
                  <TruckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Đang cập nhật thông tin vận chuyển</p>
                  <p className="text-sm">Vui lòng kiểm tra lại sau</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;