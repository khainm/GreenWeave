import React, { useState, useEffect } from 'react'
import type { DashboardActivity } from '../../services/dashboardService'

type Item = {
  name: string
  action: string
  value: string
  time: string
  type: 'sale' | 'purchase' | 'order' | 'customer'
}

interface ActivityPanelProps {
  activities?: DashboardActivity[]
}

const getMockItems = (): Item[] => [
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa bán đơn hàng', value: '42.9 tr', time: 'một giờ trước', type: 'sale' },
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa nhập hàng', value: '0 đ', time: 'một giờ trước', type: 'purchase' },
  { name: 'Minh Khai', action: 'vừa bán đơn hàng', value: '16.9 tr', time: 'một ngày trước', type: 'sale' },
  { name: 'Minh Khai', action: 'vừa nhập hàng', value: '0 đ', time: 'một ngày trước', type: 'purchase' },
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa bán đơn hàng', value: '44.2 tr', time: '2 ngày trước', type: 'sale' }
]

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'sale':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    case 'purchase':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'order':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'sale':
      return 'bg-green-100 text-green-600'
    case 'purchase':
      return 'bg-blue-100 text-blue-600'
    case 'order':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const ActivityItem: React.FC<{ item: Item; index: number }> = ({ item, index }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div className={`flex items-start p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group ${
      isVisible ? 'animate-slide-up' : 'opacity-0'
    }`}>
      <div className={`w-10 h-10 rounded-full ${getActivityColor(item.type)} flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        {getActivityIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 leading-relaxed">
          <span className="text-green-600 font-semibold hover:text-green-700 transition-colors cursor-pointer">{item.name}</span> {item.action} với giá trị <span className="font-bold text-gray-900">{item.value}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {item.time}
        </div>
      </div>
    </div>
  )
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ activities = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Convert DashboardActivity to Item format
  const items: Item[] = activities.length > 0 
    ? activities.map(activity => ({
        name: activity.user,
        action: activity.title,
        value: activity.value || '',
        time: formatTimeAgo(activity.timestamp),
        type: activity.type as 'sale' | 'purchase' | 'order' | 'customer'
      }))
    : getMockItems()
  const [visibleItems, setVisibleItems] = useState(3)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    setVisibleItems(isExpanded ? 3 : items.length)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">Hoạt động gần đây</div>
              <div className="text-sm text-gray-500">Cập nhật mới nhất</div>
            </div>
          </div>
          <button 
            onClick={toggleExpanded}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {items.slice(0, visibleItems).map((item, idx) => (
          <ActivityItem key={idx} item={item} index={idx} />
        ))}
      </div>
      
      {items.length > 3 && (
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={toggleExpanded}
            className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            {isExpanded ? 'Thu gọn' : `Xem thêm ${items.length - 3} hoạt động`}
          </button>
        </div>
      )}
    </div>
  )
}

export default ActivityPanel


