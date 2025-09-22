import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ShippingStatusBadge from '../../components/shipping/ShippingStatusBadge';
import type { Order, OrderFilters } from '../../types/order';
import { ShippingProvider, ShippingProviderNames } from '../../types/shipping';
import OrderService from '../../services/orderService';
import ShippingService from '../../services/shippingService';
import { 
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    if (!user || !['Admin', 'Staff'].includes(user.roles?.[0] || '')) {
      navigate('/');
      return;
    }
    
    loadOrders();
  }, [user, navigate, currentPage, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await OrderService.getOrders(filters);
      setOrders(response.orders || []);
      setTotalPages(Math.ceil((response.total || 0) / pageSize));
      
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    setSelectedOrders(prev => 
      checked 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? orders.map(order => order.id) : []);
  };

  const handleBulkAction = async (action: 'approve' | 'cancel') => {
    if (selectedOrders.length === 0) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedOrders.map(orderId => 
          action === 'approve' 
            ? OrderService.updateOrderStatus({ orderId, status: 'Confirmed' })
            : OrderService.updateOrderStatus({ orderId, status: 'Cancelled' })
        )
      );
      
      setSelectedOrders([]);
      await loadOrders();
      
    } catch (err: any) {
      setError(err.message || `Có lỗi xảy ra khi ${action === 'approve' ? 'duyệt' : 'hủy'} đơn hàng`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleCreateShipment = async (orderId: number, provider: ShippingProvider) => {
    try {
      await ShippingService.createShipment(orderId, {
        provider,
        note: 'Tạo vận đơn từ admin'
      });
      
      await loadOrders();
      
    } catch (err: any) {
      setError(err.message || 'Không thể tạo vận đơn');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case 'shipping':
        return <TruckIcon className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
              <p className="text-gray-600">Quản lý đơn hàng và vận chuyển</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Bộ lọc
              </button>
              
              <button
                onClick={loadOrders}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Tải lại
              </button>
            </div>
          </div>


          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 underline hover:no-underline"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc đơn hàng</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Mã đơn hàng, khách hàng..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái đơn hàng
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    <option value="Pending">Chờ xác nhận</option>
                    <option value="Confirmed">Đã xác nhận</option>
                    <option value="Processing">Đang xử lý</option>
                    <option value="Shipping">Đang giao hàng</option>
                    <option value="Delivered">Đã giao hàng</option>
                    <option value="Cancelled">Đã hủy</option>
                  </select>
                </div>

                {/* Customer ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Khách hàng
                  </label>
                  <input
                    type="number"
                    placeholder="Nhập ID khách hàng"
                    value={filters.customerId || ''}
                    onChange={(e) => handleFilterChange('customerId', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}

          {/* Bulk actions */}
          {selectedOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Đã chọn {selectedOrders.length} đơn hàng
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Duyệt đơn
                  </button>
                  <button
                    onClick={() => handleBulkAction('cancel')}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Hủy đơn
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có đơn hàng nào
                </h3>
                <p className="text-gray-500">
                  Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedOrders.length === orders.length && orders.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn hàng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Khách hàng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vận chuyển
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tổng tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.items.length} sản phẩm
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.customer.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.customer.email}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(order.status)}
                              <span className="ml-2 text-sm text-gray-900">
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {ShippingProviderNames[order.shippingProvider as ShippingProvider] || order.shippingProvider}
                              </div>
                              {order.shippingStatus ? (
                                <ShippingStatusBadge status={order.shippingStatus} />
                              ) : (
                                <span className="text-xs text-gray-500">Chưa tạo vận đơn</span>
                              )}
                              {order.shippingCode && (
                                <div className="text-xs text-gray-500 font-mono">
                                  {order.shippingCode}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.total.toLocaleString('vi-VN')}đ
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/admin/orders/${order.id}`}
                                className="text-green-600 hover:text-green-900"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Link>
                              
                              {order.status === 'Pending' && (
                                <button
                                  onClick={() => handleBulkAction('approve')}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Duyệt đơn"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                              )}
                              
                              {order.status === 'Confirmed' && !order.shippingCode && (
                                <button
                                  onClick={() => handleCreateShipment(order.id, order.shippingProvider as ShippingProvider)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Tạo vận đơn"
                                >
                                  <TruckIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                    
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Trước
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Sau
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;