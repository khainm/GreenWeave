import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShippingProvider, 
  ShippingProviderNames, 
  ShippingStatus
} from '../../types/shipping';
import ShippingStatusBadge from '../shipping/ShippingStatusBadge';
import { 
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ShippingActivity {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  provider: ShippingProvider;
  trackingCode?: string;
  oldStatus?: ShippingStatus;
  newStatus: ShippingStatus;
  timestamp: string;
  description: string;
  location?: string;
}

interface RecentShippingActivitiesWidgetProps {
  className?: string;
  limit?: number;
}

const RecentShippingActivitiesWidget: React.FC<RecentShippingActivitiesWidgetProps> = ({ 
  className = '',
  limit = 10 
}) => {
  const [activities, setActivities] = useState<ShippingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentActivities();
  }, [limit]);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const mockActivities: ShippingActivity[] = [
        {
          id: 1,
          orderId: 123,
          orderNumber: 'ORD202509210001',
          customerName: 'Nguyễn Văn An',
          provider: ShippingProvider.ViettelPost,
          trackingCode: 'VTP123456789',
          oldStatus: ShippingStatus.InTransit,
          newStatus: ShippingStatus.Delivered,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          description: 'Đã giao hàng thành công',
          location: 'Hà Nội'
        },
        {
          id: 2,
          orderId: 124,
          orderNumber: 'ORD202509210002',
          customerName: 'Trần Thị Bình',
          provider: ShippingProvider.ViettelPost,
          trackingCode: 'VTP987654321',
          oldStatus: ShippingStatus.PendingPickup,
          newStatus: ShippingStatus.Picked,
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          description: 'Đã lấy hàng',
          location: 'TP. Hồ Chí Minh'
        },
        {
          id: 3,
          orderId: 125,
          orderNumber: 'ORD202509210003',
          customerName: 'Lê Văn Cường',
          provider: ShippingProvider.ViettelPost,
          trackingCode: 'VTP555666777',
          newStatus: ShippingStatus.PendingPickup,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          description: 'Tạo vận đơn mới',
          location: 'Kho GreenWeave'
        },
        {
          id: 4,
          orderId: 126,
          orderNumber: 'ORD202509210004',
          customerName: 'Phạm Thị Dung',
          provider: ShippingProvider.ViettelPost,
          trackingCode: 'VTP111222333',
          oldStatus: ShippingStatus.OutForDelivery,
          newStatus: ShippingStatus.Failed,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          description: 'Giao hàng thất bại - Khách không có nhà',
          location: 'Đà Nẵng'
        },
        {
          id: 5,
          orderId: 127,
          orderNumber: 'ORD202509210005',
          customerName: 'Hoàng Văn Em',
          provider: ShippingProvider.ViettelPost,
          trackingCode: 'VTP444555666',
          oldStatus: ShippingStatus.Picked,
          newStatus: ShippingStatus.InTransit,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Đang vận chuyển đến trung tâm phân loại',
          location: 'Hải Phòng'
        }
      ];
      
      setActivities(mockActivities.slice(0, limit));
      
    } catch (err) {
      setError('Không thể tải hoạt động gần đây');
      console.error('Error loading recent activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (newStatus: ShippingStatus, oldStatus?: ShippingStatus) => {
    if (!oldStatus) {
      // New shipment created
      return <TruckIcon className="w-5 h-5 text-blue-500" />;
    }

    switch (newStatus) {
      case ShippingStatus.Delivered:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case ShippingStatus.Failed:
      case ShippingStatus.Cancelled:
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case ShippingStatus.InTransit:
      case ShippingStatus.OutForDelivery:
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const getProviderColor = (provider: ShippingProvider) => {
    switch (provider) {
      case ShippingProvider.ViettelPost:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
          <button
            onClick={loadRecentActivities}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Hoạt động vận chuyển gần đây
        </h3>
        
        <button
          onClick={loadRecentActivities}
          className="text-gray-400 hover:text-gray-600"
          title="Làm mới"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <TruckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có hoạt động vận chuyển nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.newStatus, activity.oldStatus)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/orders/${activity.orderId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{activity.orderNumber}
                    </Link>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProviderColor(activity.provider)}`}>
                      {ShippingProviderNames[activity.provider]}
                    </span>
                  </div>
                  
                  <Link
                    to={`/admin/orders/${activity.orderId}`}
                    className="text-gray-400 hover:text-gray-600"
                    title="Xem chi tiết"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-900">
                    {activity.customerName}
                  </p>
                  
                  <ShippingStatusBadge status={activity.newStatus} />
                </div>
                
                <p className="text-sm text-gray-600 mb-1">
                  {activity.description}
                  {activity.location && (
                    <span className="text-gray-500"> • {activity.location}</span>
                  )}
                </p>
                
                {activity.trackingCode && (
                  <p className="text-xs text-gray-500 font-mono">
                    Mã vận đơn: {activity.trackingCode}
                  </p>
                )}
                
                <p className="text-xs text-gray-400 mt-1">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View all link */}
      {activities.length > 0 && (
        <div className="mt-4 text-center">
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Xem tất cả đơn hàng →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentShippingActivitiesWidget;
