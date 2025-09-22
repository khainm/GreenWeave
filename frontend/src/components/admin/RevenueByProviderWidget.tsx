import React, { useState, useEffect } from 'react';
import { ShippingProvider, ShippingProviderNames } from '../../types/shipping';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ProviderRevenue {
  provider: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number; // percentage
  shippingFees: number;
}

interface RevenueByProviderWidgetProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d';
}

const RevenueByProviderWidget: React.FC<RevenueByProviderWidgetProps> = ({ 
  className = '',
  timeRange = '30d' 
}) => {
  const [data, setData] = useState<ProviderRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadRevenueData();
  }, [timeRange]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData: ProviderRevenue[] = [
        {
          provider: 'ViettelPost',
          revenue: 359300000,
          orders: 156,
          averageOrderValue: 2303000,
          growth: 12.5,
          shippingFees: 3903000
        }
      ];
      
      setData(mockData);
      setTotalRevenue(mockData.reduce((sum, item) => sum + item.revenue, 0));
      
    } catch (err) {
      setError('Không thể tải dữ liệu doanh thu');
      console.error('Error loading revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'ViettelPost':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowTrendingUpIcon className="w-4 h-4" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
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
            onClick={loadRevenueData}
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
          <ChartBarIcon className="w-5 h-5 mr-2" />
          Doanh thu ViettelPost
        </h3>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">Tổng doanh thu</p>
          <p className="text-lg font-semibold text-green-600">
            {totalRevenue.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data
          .sort((a, b) => b.revenue - a.revenue)
          .map((item) => {
            const revenuePercentage = (item.revenue / totalRevenue) * 100;
            
            return (
              <div key={item.provider} className={`border-l-4 p-4 rounded-lg ${getProviderColor(item.provider)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {ShippingProviderNames[item.provider as ShippingProvider] || item.provider}
                  </h4>
                  
                  <div className={`flex items-center ${getGrowthColor(item.growth)}`}>
                    {getGrowthIcon(item.growth)}
                    <span className="text-sm font-medium ml-1">
                      {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Doanh thu</p>
                    <p className="font-semibold text-gray-900">
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-gray-500">
                      {revenuePercentage.toFixed(1)}% tổng
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Đơn hàng</p>
                    <p className="font-semibold text-gray-900">
                      {item.orders}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Giá trị TB</p>
                    <p className="font-semibold text-gray-900">
                      {item.averageOrderValue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Phí vận chuyển</p>
                    <p className="font-semibold text-gray-900">
                      {item.shippingFees.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                {/* Revenue bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full opacity-60" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Tổng đơn hàng</p>
            <p className="text-lg font-semibold text-gray-900">
              {data[0]?.orders || 0}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">Giá trị TB</p>
            <p className="text-lg font-semibold text-gray-900">
              {data[0]?.averageOrderValue.toLocaleString('vi-VN') || '0'}đ
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">Tổng phí ship</p>
            <p className="text-lg font-semibold text-gray-900">
              {data[0]?.shippingFees.toLocaleString('vi-VN') || '0'}đ
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">Tăng trưởng</p>
            <p className={`text-lg font-semibold ${getGrowthColor(data[0]?.growth || 0)}`}>
              {(data[0]?.growth || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueByProviderWidget;
