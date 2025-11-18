import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';  
import ShippingStatusBadge from '../../components/shipping/ShippingStatusBadge';
import TrackingTimeline from '../../components/shipping/TrackingTimeline';
import type { 
  Order,
  TrackingInfo, 
  ShippingProvider, 
  ShippingRequest,
  CreateShipmentRequest,
  CancelShipmentRequest
} from '../../types';
import OrderService from '../../services/orderService';
import ShippingService from '../../services/shippingService';
import { WebhookService, type WebhookEvent } from '../../services/webhookService';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CpuChipIcon,
  ArrowPathIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [shippingRequest, setShippingRequest] = useState<ShippingRequest | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'order' | 'shipping' | 'logs' | 'webhook'>('order');
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelShipmentModal, setShowCancelShipmentModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ShippingProvider>('ViettelPost');
  const [shipmentNote, setShipmentNote] = useState('');
  
  // ViettelPost order status update states
  const [showApproveVTPModal, setShowApproveVTPModal] = useState(false);
  const [showCancelVTPModal, setShowCancelVTPModal] = useState(false);
  const [vtpUpdateNote, setVtpUpdateNote] = useState('');

  useEffect(() => {
    if (!user || !user.roles?.includes('Admin') && !user.roles?.includes('Staff')) {
      navigate('/admin');
      return;
    }
    
    if (!id) {
      navigate('/admin/orders');
      return;
    }

    loadOrderDetails();
  }, [id, user, navigate]);

  useEffect(() => {
    if (order && order.shippingCode && activeTab === 'shipping') {
      loadShippingData();
    }
    if (order && activeTab === 'webhook') {
      loadWebhookLogs();
    }
  }, [order, activeTab]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = await OrderService.getOrderById(parseInt(id!));
      setOrder(orderData);
      
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin đơn hàng');
      console.error('Error loading order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadShippingData = async () => {
    if (!order) return;

    try {
      const [trackingData, shippingRequestData] = await Promise.all([
        ShippingService.getTracking(order.id).catch(() => null),
        ShippingService.getShippingRequest(order.id).catch(() => null)
      ]);
      
      setTracking(trackingData);
      setShippingRequest(shippingRequestData);
    } catch (err) {
      console.error('Error loading shipping data:', err);
    }
  };

  const loadWebhookLogs = async () => {
    if (!order) return;

    try {
      console.log(`🔍 Loading webhook logs for order ID: ${order.id}`);
      const logs = await WebhookService.getWebhookLogsByOrderId(order.id);
      console.log(`✅ Loaded ${logs.length} webhook logs:`, logs);
      setWebhookLogs(logs);
    } catch (err) {
      console.error('❌ Error loading webhook logs:', err);
      setWebhookLogs([]);
    }
  };

  const handleUpdateOrderStatus = async (status: 'Confirmed' | 'Cancelled') => {
    if (!order) return;

    setActionLoading(`update-${status}`);
    try {
      await OrderService.updateOrderStatus({ orderId: order.id, status: status as any });
      await loadOrderDetails();
      
      // Auto-create shipment if order is confirmed
      if (status === 'Confirmed' && !order.shippingCode) {
        setShowCreateShipmentModal(true);
      }
      
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateShipment = async () => {
    if (!order) return;

    setActionLoading('create-shipment');
    try {
      const request: Omit<CreateShipmentRequest, 'orderId'> = {
        provider: selectedProvider,
        note: shipmentNote || 'Tạo vận đơn từ admin'
      };

      await ShippingService.createShipment(order.id, request);
      await loadOrderDetails();
      setShowCreateShipmentModal(false);
      setShipmentNote('');
      
    } catch (err: any) {
      setError(err.message || 'Không thể tạo vận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelShipment = async () => {
    if (!order || !cancelReason.trim()) return;

    setActionLoading('cancel-shipment');
    try {
      const request: CancelShipmentRequest = {
        reason: cancelReason.trim()
      };

      await ShippingService.cancelShipment(order.id, request);
      await loadOrderDetails();
      setShowCancelShipmentModal(false);
      setCancelReason('');
      
    } catch (err: any) {
      setError(err.message || 'Không thể hủy vận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveViettelPostOrder = async () => {
    if (!order) return;

    setActionLoading('approve-vtp');
    try {
      const result = await ShippingService.updateViettelPostOrderStatus(order.id, {
        updateType: 1, // Approve
        note: vtpUpdateNote || 'Duyệt vận đơn'
      });

      if (result.success) {
        await loadOrderDetails();
        await loadShippingData();
        setShowApproveVTPModal(false);
        setVtpUpdateNote('');
        // Show success message
        setError(null);
      } else {
        setError(result.error || 'Không thể duyệt vận đơn');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể duyệt vận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelViettelPostOrder = async () => {
    if (!order || !vtpUpdateNote.trim()) {
      setError('Vui lòng nhập lý do hủy vận đơn');
      return;
    }

    setActionLoading('cancel-vtp');
    try {
      const result = await ShippingService.updateViettelPostOrderStatus(order.id, {
        updateType: 4, // Cancel
        note: vtpUpdateNote.trim()
      });

      if (result.success) {
        await loadOrderDetails();
        await loadShippingData();
        setShowCancelVTPModal(false);
        setVtpUpdateNote('');
        setError(null);
      } else {
        setError(result.error || 'Không thể hủy vận đơn');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể hủy vận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintLabel = async () => {
    if (!order) return;

    setActionLoading('print-label');
    try {
      // Set expiry time to 7 days from now
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      
      const result = await ShippingService.getPrintingCode([order.id], expiryTime);

      if (result.success && result.printingCode) {
        // Generate print URL (A6_1 format with postage - suitable for small items like bags and hats)
        const printUrl = `https://digitalize.viettelpost.vn/DigitalizePrint/report.do?type=a6_1&bill=${result.printingCode}&showPostage=1`;
        
        // Open in new tab
        window.open(printUrl, '_blank');
        setError(null);
      } else {
        setError(result.error || 'Không thể lấy mã in vận đơn');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể in vận đơn');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshTracking = async () => {
    setActionLoading('refresh-tracking');
    try {
      await loadShippingData();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật thông tin vận chuyển');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Không tìm thấy đơn hàng'}
          </h1>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-green-600 hover:text-green-700 underline"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </AdminLayout>
    );
  }

  const canCreateShipment = order.status === 'Confirmed' && !order.shippingCode;
  const canCancelShipment = order.shippingCode && 
    order.shippingStatus !== 'Delivered' && 
    order.shippingStatus !== 'Cancelled';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đơn hàng #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')} bởi {order.customer.fullName}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {order.status === 'Pending' && (
              <>
                <button
                  onClick={() => handleUpdateOrderStatus('Confirmed')}
                  disabled={!!actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Duyệt đơn
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus('Cancelled')}
                  disabled={!!actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Từ chối
                </button>
              </>
            )}

            {canCreateShipment && (
              <button
                onClick={() => setShowCreateShipmentModal(true)}
                disabled={!!actionLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <TruckIcon className="w-4 h-4 mr-1" />
                Tạo vận đơn
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Auto-processing notice for this order */}
        {(order.paymentMethod === 'CashOnDelivery' || order.paymentMethod === 'PayOS') && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    🤖 Đơn hàng được xử lý tự động
                  </h3>
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    {order.paymentMethod === 'CashOnDelivery' ? 'COD' : 'PayOS'}
                  </span>
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  {order.paymentMethod === 'CashOnDelivery' ? (
                    <>
                      <p className="flex items-center gap-1.5">
                        <span className="text-green-600">✓</span>
                        <span>Đã tự động xác nhận ngay khi tạo đơn ({order.confirmedAt ? new Date(order.confirmedAt).toLocaleString('vi-VN') : 'N/A'})</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-green-600">✓</span>
                        <span>Đã tự động tạo vận đơn ViettelPost {order.shippingCode ? `(Tracking: ${order.shippingCode})` : ''}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-green-600">✓</span>
                        <span>Đã gửi email xác nhận đến khách hàng</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-1.5">
                        <span className={order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}>
                          {order.paymentStatus === 'Paid' ? '✓' : '⏳'}
                        </span>
                        <span>
                          {order.paymentStatus === 'Paid' 
                            ? `Đã thanh toán và tự động xác nhận (${order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : 'N/A'})`
                            : 'Chờ webhook PayOS xác nhận thanh toán để tự động xử lý'
                          }
                        </span>
                      </p>
                      {order.paymentStatus === 'Paid' && (
                        <>
                          <p className="flex items-center gap-1.5">
                            <span className="text-green-600">✓</span>
                            <span>Đã tự động tạo vận đơn ViettelPost {order.shippingCode ? `(Tracking: ${order.shippingCode})` : ''}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-green-600">✓</span>
                            <span>Đã gửi email xác nhận đến khách hàng</span>
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded inline-block">
                  💡 Admin chỉ cần can thiệp nếu có lỗi hoặc yêu cầu đặc biệt từ khách hàng
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Trạng thái đơn hàng</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {order.status}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Thanh toán</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {order.paymentStatus}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vận chuyển</h3>
              <p className="mt-1 text-sm text-gray-900">
                {order.shippingProvider}
              </p>
              {order.shippingStatus && (
                <ShippingStatusBadge status={order.shippingStatus} className="mt-1" />
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tổng tiền</h3>
              <p className="mt-1 text-lg font-semibold text-green-600">
                {order.total.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('order')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'order'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                Chi tiết đơn hàng
              </button>
              
              <button
                onClick={() => setActiveTab('shipping')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'shipping'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <TruckIcon className="w-4 h-4 inline mr-2" />
                Vận chuyển
                {order.shippingCode && (
                  <span className="ml-1 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">
                    {order.shippingCode}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('logs')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'logs'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <CpuChipIcon className="w-4 h-4 inline mr-2" />
                Logs & API
              </button>

              <button
                onClick={() => setActiveTab('webhook')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'webhook'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <ArrowPathIcon className="w-4 h-4 inline mr-2" />
                Webhook VTP
                {webhookLogs.length > 0 && (
                  <span className="ml-1 bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-xs">
                    {webhookLogs.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Order Tab */}
            {activeTab === 'order' && (
              <div className="space-y-6">
                {/* Customer info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin khách hàng</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.shippingAddress.fullName || order.shippingAddress.name || order.customer.fullName}
                        </p>
                        <p className="text-sm text-gray-600">{order.customer.email}</p>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.phoneNumber || order.shippingAddress.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.addressLine || order.shippingAddress.addressDetail || 'Chưa có địa chỉ chi tiết'}
                          {order.shippingAddress.ward && `, ${order.shippingAddress.ward}`}
                          , {order.shippingAddress.district}, {order.shippingAddress.province}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sản phẩm</h3>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={item.productImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × {item.unitPrice.toLocaleString('vi-VN')}đ
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
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tóm tắt</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span>{order.shippingFee.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá:</span>
                          <span>-{order.discount.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <hr />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Tổng cộng:</span>
                        <span>{order.total.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ghi chú</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{order.notes}</p>
                    </div>
                  </div>
                )}

                {/* Shipping info overview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin vận chuyển</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Đơn vị vận chuyển</p>
                        <p className="text-gray-600">{order.shippingProvider}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Trạng thái vận chuyển</p>
                        {order.shippingStatus ? (
                          <ShippingStatusBadge status={order.shippingStatus} />
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Chưa có thông tin
                          </span>
                        )}
                      </div>

                      {order.shippingCode && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-900 mb-2">Mã vận đơn</p>
                          <p className="text-gray-600 font-mono">{order.shippingCode}</p>
                        </div>
                      )}
                    </div>

                    {!order.shippingCode && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          {order.status === 'Pending' 
                            ? '💡 Cần duyệt đơn hàng trước khi tạo vận đơn'
                            : '💡 Chuyển sang tab "Vận chuyển" để tạo vận đơn'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                {/* Shipping actions */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Quản lý vận chuyển</h3>
                  
                  <div className="flex items-center gap-2">
                    {order.shippingCode && (
                      <button
                        onClick={handleRefreshTracking}
                        disabled={actionLoading === 'refresh-tracking'}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ArrowPathIcon className={`w-4 h-4 mr-1 ${actionLoading === 'refresh-tracking' ? 'animate-spin' : ''}`} />
                        Cập nhật
                      </button>
                    )}

                    {canCreateShipment && (
                      <button
                        onClick={() => setShowCreateShipmentModal(true)}
                        disabled={!!actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <TruckIcon className="w-4 h-4 mr-1" />
                        Tạo vận đơn
                      </button>
                    )}

                    {canCancelShipment && (
                      <button
                        onClick={() => setShowCancelShipmentModal(true)}
                        disabled={!!actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Hủy vận đơn
                      </button>
                    )}

                    {/* ViettelPost order status update buttons */}
                    {order.shippingCode && order.shippingProvider === 'ViettelPost' && (
                      <>
                        <button
                          onClick={handlePrintLabel}
                          disabled={!!actionLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          <PrinterIcon className="w-4 h-4 mr-1" />
                          In vận đơn
                        </button>

                        <button
                          onClick={() => setShowApproveVTPModal(true)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Duyệt vận đơn VTP
                        </button>
                        
                        <button
                          onClick={() => setShowCancelVTPModal(true)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Hủy VTP Order
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Shipping info */}
                {order.shippingCode ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Đơn vị vận chuyển</p>
                        <p className="text-sm text-gray-600">
                          {order.shippingProvider}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mã vận đơn</p>
                        <p className="text-sm text-gray-600 font-mono">{order.shippingCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Trạng thái</p>
                        {order.shippingStatus && <ShippingStatusBadge status={order.shippingStatus} />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Chưa tạo vận đơn</p>
                    <p className="text-sm text-gray-500">
                      {order.status === 'Pending' 
                        ? 'Cần duyệt đơn hàng trước khi tạo vận đơn'
                        : 'Nhấn "Tạo vận đơn" để bắt đầu vận chuyển'
                      }
                    </p>
                  </div>
                )}

                {/* Tracking timeline */}
                {tracking ? (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Lịch sử vận chuyển</h4>
                    <TrackingTimeline events={tracking.events} currentStatus={tracking.status} />
                  </div>
                ) : order.shippingHistory && order.shippingHistory.length > 0 ? (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Lịch sử vận chuyển</h4>
                    <TrackingTimeline events={order.shippingHistory} currentStatus={order.shippingStatus || ''} />
                  </div>
                ) : order.shippingCode ? (
                  <div className="text-center py-8 text-gray-500">
                    <TruckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Đang cập nhật thông tin vận chuyển</p>
                    <p className="text-sm">Vui lòng kiểm tra lại sau</p>
                  </div>
                ) : null}

                {/* Shipping request details */}
                {shippingRequest && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Chi tiết yêu cầu vận chuyển</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">ID yêu cầu</p>
                          <p className="text-sm text-gray-600">{shippingRequest.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Phí vận chuyển</p>
                          <p className="text-sm text-gray-600">{shippingRequest.fee.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Ngày tạo</p>
                          <p className="text-sm text-gray-600">
                            {new Date(shippingRequest.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {shippingRequest.note && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Ghi chú</p>
                            <p className="text-sm text-gray-600">{shippingRequest.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="text-center py-12 text-gray-500">
                  <CpuChipIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Shipping Transaction Logs</p>
                  <p className="text-sm">Tính năng này sẽ hiển thị logs API calls với shipping providers</p>
                </div>
              </div>
            )}

            {/* Webhook Tab */}
            {activeTab === 'webhook' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Webhook ViettelPost
                    </h3>
                    <p className="text-sm text-gray-600">
                      Lịch sử callback từ ViettelPost về trạng thái đơn hàng
                    </p>
                  </div>
                  <button
                    onClick={loadWebhookLogs}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    <ArrowPathIcon className="w-4 h-4 inline mr-1" />
                    Làm mới
                  </button>
                </div>

                {webhookLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Chưa có webhook nào</p>
                    <p className="text-sm">ViettelPost sẽ gửi callback khi có cập nhật trạng thái đơn hàng</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`border rounded-lg p-4 ${
                          log.isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {log.isSuccess ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircleIcon className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-medium text-gray-900">
                                {log.statusDescription}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.orderStatus === 501 ? 'bg-green-100 text-green-800' :
                                log.orderStatus === 508 || log.orderStatus === 200 ? 'bg-blue-100 text-blue-800' :
                                log.orderStatus === 507 ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.orderStatus}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                              <div>
                                <span className="font-medium">Thời gian:</span>
                                <p>{new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                              </div>
                              <div>
                                <span className="font-medium">Mã vận đơn:</span>
                                <p className="font-mono text-xs">{log.orderNumber}</p>
                              </div>
                              <div>
                                <span className="font-medium">Dịch vụ:</span>
                                <p>{log.orderService}</p>
                              </div>
                              <div>
                                <span className="font-medium">Tiền COD:</span>
                                <p className="text-green-600 font-medium">
                                  {log.moneyCollection.toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            </div>

                            {log.note && (
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Ghi chú:</span>
                                <p>{log.note}</p>
                              </div>
                            )}

                            {log.errorMessage && (
                              <div className="text-sm text-red-600">
                                <span className="font-medium">Lỗi:</span>
                                <p>{log.errorMessage}</p>
                              </div>
                            )}

                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <span>💰 Tổng: {log.moneyTotal.toLocaleString('vi-VN')}đ</span>
                              <span>⚖️ {log.productWeight}g</span>
                              <span>🚚 {log.orderService}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {webhookLogs.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📋 Giải thích mã trạng thái ViettelPost:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>501:</strong> Đã giao hàng / Đã hoàn thành</li>
                      <li>• <strong>508:</strong> Đang giao hàng (shipper đang trên đường)</li>
                      <li>• <strong>200:</strong> Đang xử lý / Trạng thái trung gian</li>
                      <li>• <strong>507:</strong> Giao hàng thất bại / Giao lại</li>
                      <li>• <strong>515:</strong> Hàng đã nhập kho ViettelPost</li>
                      <li>• <strong>550:</strong> Hàng đã chuyển hoàn</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateShipmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo vận đơn</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị vận chuyển
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as ShippingProvider)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Internal">Giao hàng nội bộ</option>
                    <option value="ViettelPost">Viettel Post</option>
                    <option value="GHN">Giao Hàng Nhanh</option>
                    <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                    <option value="JTExpress">J&T Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={shipmentNote}
                    onChange={(e) => setShipmentNote(e.target.value)}
                    placeholder="Ghi chú cho vận đơn (không bắt buộc)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCreateShipment}
                  disabled={actionLoading === 'create-shipment'}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading === 'create-shipment' ? 'Đang tạo...' : 'Tạo vận đơn'}
                </button>
                <button
                  onClick={() => setShowCreateShipmentModal(false)}
                  disabled={!!actionLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Shipment Modal */}
      {showCancelShipmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hủy vận đơn</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy vận đơn..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
                    <div className="text-sm text-yellow-700">
                      <p>Lưu ý: Hành động này không thể hoàn tác. Vận đơn sẽ bị hủy và không thể khôi phục.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCancelShipment}
                  disabled={!cancelReason.trim() || actionLoading === 'cancel-shipment'}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'cancel-shipment' ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelShipmentModal(false);
                    setCancelReason('');
                  }}
                  disabled={!!actionLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve ViettelPost Order Modal */}
      {showApproveVTPModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Duyệt vận đơn ViettelPost</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    value={vtpUpdateNote}
                    onChange={(e) => setVtpUpdateNote(e.target.value)}
                    placeholder="Nhập ghi chú cho việc duyệt vận đơn..."
                    maxLength={150}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {vtpUpdateNote.length}/150 ký tự
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <div className="flex">
                    <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <div className="text-sm text-blue-700">
                      <p>Vận đơn sẽ được duyệt trên hệ thống ViettelPost và chuyển sang trạng thái "Đã lấy hàng".</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleApproveViettelPostOrder}
                  disabled={actionLoading === 'approve-vtp'}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === 'approve-vtp' ? 'Đang duyệt...' : 'Xác nhận duyệt'}
                </button>
                <button
                  onClick={() => {
                    setShowApproveVTPModal(false);
                    setVtpUpdateNote('');
                  }}
                  disabled={!!actionLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel ViettelPost Order Modal */}
      {showCancelVTPModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hủy vận đơn ViettelPost</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={vtpUpdateNote}
                    onChange={(e) => setVtpUpdateNote(e.target.value)}
                    placeholder="Nhập lý do hủy vận đơn ViettelPost..."
                    maxLength={150}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {vtpUpdateNote.length}/150 ký tự
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 mr-2" />
                    <div className="text-sm text-orange-700">
                      <p><strong>Điều kiện hủy:</strong> Vận đơn phải có trạng thái &lt; 200 và khác 105, 107.</p>
                      <p className="mt-1">Lưu ý: Hành động này sẽ hủy vận đơn trên hệ thống ViettelPost.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCancelViettelPostOrder}
                  disabled={!vtpUpdateNote.trim() || actionLoading === 'cancel-vtp'}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {actionLoading === 'cancel-vtp' ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelVTPModal(false);
                    setVtpUpdateNote('');
                  }}
                  disabled={!!actionLoading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrderDetailPage;
