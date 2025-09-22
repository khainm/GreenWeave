import React from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { TrackingEvent, ShippingStatus } from '../../types';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: ShippingStatus | string;
  className?: string;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ 
  events, 
  currentStatus, 
  className = '' 
}) => {
  const getStatusIcon = (status: string, isLatest: boolean = false) => {
    const iconClass = `w-5 h-5 ${isLatest ? 'text-green-600' : 'text-gray-400'}`;
    
    if (status.toLowerCase().includes('delivered') || status.toLowerCase().includes('giao')) {
      return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
    }
    
    if (status.toLowerCase().includes('failed') || 
        status.toLowerCase().includes('cancelled') || 
        status.toLowerCase().includes('thất bại') ||
        status.toLowerCase().includes('hủy')) {
      return <XCircleIcon className={`${iconClass} text-red-600`} />;
    }
    
    return <ClockIcon className={iconClass} />;
  };

  const getStatusColor = (status: string, isLatest: boolean = false) => {
    if (isLatest) return 'text-green-600 font-medium';
    
    if (status.toLowerCase().includes('delivered') || status.toLowerCase().includes('giao')) {
      return 'text-green-600';
    }
    
    if (status.toLowerCase().includes('failed') || 
        status.toLowerCase().includes('cancelled') || 
        status.toLowerCase().includes('thất bại') ||
        status.toLowerCase().includes('hủy')) {
      return 'text-red-600';
    }
    
    return 'text-gray-600';
  };

  if (!events || events.length === 0) {
    return (
      <div className={`tracking-timeline ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có thông tin vận chuyển</p>
        </div>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={`tracking-timeline ${className}`}>
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedEvents.map((event, index) => {
            const isLatest = index === 0;
            
            return (
              <li key={`${event.timestamp}-${index}`}>
                <div className="relative pb-8">
                  {index !== sortedEvents.length - 1 && (
                    <span 
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                      aria-hidden="true" 
                    />
                  )}
                  
                  <div className="relative flex space-x-3">
                    <div className="flex items-center">
                      <div className={`
                        relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 
                        ${isLatest 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-300 bg-white'
                        }
                      `}>
                        {getStatusIcon(event.status, isLatest)}
                      </div>
                    </div>
                    
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className={`text-sm ${getStatusColor(event.description, isLatest)}`}>
                          {event.description}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                      
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <time dateTime={event.timestamp}>
                          {new Date(event.timestamp).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Trạng thái hiện tại
            </p>
            <p className={`text-sm ${getStatusColor(sortedEvents[0]?.description || '', true)}`}>
              {sortedEvents[0]?.description || 'Không có thông tin'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Cập nhật lần cuối
            </p>
            <p className="text-sm font-medium text-gray-900">
              {sortedEvents[0] && new Date(sortedEvents[0].timestamp).toLocaleString('vi-VN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;
