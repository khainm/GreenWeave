import React, { useState, useEffect } from 'react';
import { 
  ShippingProvider, 
  ShippingProviderNames, 
  ShippingStatus, 
  ShippingStatusNames 
} from '../../types/shipping';
import { 
  TruckIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ShippingStats {
  totalOrders: number;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
  revenue: Record<string, number>;
  pendingPickup: number;
  inTransit: number;
  delivered: number;
  failed: number;
}

interface ShippingStatsWidgetProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d';
}

const ShippingStatsWidget: React.FC<ShippingStatsWidgetProps> = ({ 
  className = '',
  timeRange = '30d' 
}) => {
  const [stats, setStats] = useState<ShippingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShippingStats();
  }, [timeRange]);

  const loadShippingStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalOrders: 156,
        byProvider: {
          'ViettelPost': 89,
          'Internal': 34,
          'GHN': 21,
          'GHTK': 12
        },
        byStatus: {
          'PendingPickup': 23,
          'InTransit': 45,
          'Delivered': 76,
          'Failed': 8,
          'Cancelled': 4
        },
        revenue: {
          'ViettelPost': 15670000,
          'Internal': 8900000,
          'GHN': 6780000,
          'GHTK': 4560000
        },
        pendingPickup: 23,
        inTransit: 45,
        delivered: 76,
        failed: 8
      });
      
    } catch (err) {
      setError('Không thể tải thống kê vận chuyển');
      console.error('Error loading shipping stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PendingPickup':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'InTransit':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case 'Delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'ViettelPost':
        return 'bg-red-500';
      case 'GHN':
        return 'bg-orange-500';
      case 'GHTK':
        return 'bg-green-500';
      case 'Internal':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="text-center text-red-600">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error || 'Không thể tải dữ liệu'}</p>
          <button
            onClick={loadShippingStats}
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
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TruckIcon className="w-5 h-5 mr-2" />
          Thống kê vận chuyển
        </h3>
        
        <div className="text-sm text-gray-500">
          {timeRange === '7d' && 'Tuần qua'}
          {timeRange === '30d' && 'Tháng qua'}
          {timeRange === '90d' && 'Quý qua'}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-xs text-blue-600">Chờ lấy hàng</p>
              <p className="text-lg font-semibold text-blue-900">{stats.pendingPickup}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center">
            <TruckIcon className="w-5 h-5 text-yellow-500 mr-2" />
            <div>
              <p className="text-xs text-yellow-600">Đang vận chuyển</p>
              <p className="text-lg font-semibold text-yellow-900">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="text-xs text-green-600">Đã giao</p>
              <p className="text-lg font-semibold text-green-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <p className="text-xs text-red-600">Thất bại</p>
              <p className="text-lg font-semibold text-red-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Theo nhà vận chuyển</h4>
        <div className="space-y-3">
          {Object.entries(stats.byProvider)
            .sort(([,a], [,b]) => b - a)
            .map(([provider, count]) => {
              const percentage = (count / stats.totalOrders) * 100;
              return (
                <div key={provider} className="flex items-center">
                  <div className="flex-1 flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getProviderColor(provider)} mr-3`}></div>
                    <span className="text-sm text-gray-700">
                      {ShippingProviderNames[provider as ShippingProvider] || provider}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                    <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Status breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Theo trạng thái</h4>
        <div className="space-y-2">
          {Object.entries(stats.byStatus)
            .filter(([, count]) => count > 0)
            .sort(([,a], [,b]) => b - a)
            .map(([status, count]) => {
              const percentage = (count / stats.totalOrders) * 100;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(status)}
                    <span className="text-sm text-gray-700 ml-2">
                      {ShippingStatusNames[status as ShippingStatus] || status}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ShippingStatsWidget;
