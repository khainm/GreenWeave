import React from 'react';

interface ShippingStatusBadgeProps {
  status: string;
  className?: string;
}

const ShippingStatusBadge: React.FC<ShippingStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendingpickup':
        return 'text-yellow-600 bg-yellow-100';
      case 'picked':
      case 'intransit':
        return 'text-blue-600 bg-blue-100';
      case 'outfordelivery':
        return 'text-orange-600 bg-orange-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'returning':
      case 'returned':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendingpickup':
        return 'Chờ lấy hàng';
      case 'picked':
        return 'Đã lấy hàng';
      case 'intransit':
        return 'Đang vận chuyển';
      case 'outfordelivery':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'failed':
        return 'Giao hàng thất bại';
      case 'returning':
        return 'Đang hoàn trả';
      case 'returned':
        return 'Đã hoàn trả';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)} ${className}`}>
      {getStatusText(status)}
    </span>
  );
};

export default ShippingStatusBadge;