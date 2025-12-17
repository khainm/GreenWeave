import React, { useState, useEffect } from 'react'
import type { DashboardStats } from '../../services/dashboardService'

type Stat = {
  title: string
  value: string
  subtext: string
  trend: 'up' | 'down'
  icon?: React.ReactNode
}

interface StatCardsProps {
  stats?: DashboardStats | null
}

const Indicator: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => (
  <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${trend === 'up' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
    {trend === 'up' ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-bounce">
        <path d="M7 14l5-5 5 5H7z" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-bounce">
        <path d="M7 10l5 5 5-5H7z" />
      </svg>
    )}
  </div>
)

const StatCard: React.FC<Stat> = ({ title, value, subtext, trend, icon }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        {icon && (
          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{value}</div>
        <Indicator trend={trend} />
      </div>
      <div className={`text-sm font-medium transition-colors ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {subtext}
      </div>
    </div>
  )
}

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const getStatsData = (): Stat[] => {
    if (!stats) {
      return [
        { title: 'Tổng doanh thu', value: '0', subtext: 'Đang tải...', trend: 'up' },
        { title: 'Đơn hàng', value: '0', subtext: 'Đang tải...', trend: 'up' },
        { title: 'Khách hàng', value: '0', subtext: 'Đang tải...', trend: 'up' },
        { title: 'Nhân viên', value: '0', subtext: 'Đang tải...', trend: 'up' }
      ]
    }

    return [
      {
        title: 'Tổng doanh thu',
        value: '17.286.000',
        subtext: `${stats.revenueGrowth >= 0 ? '↑' : '↓'} ${Math.abs(stats.revenueGrowth)}% so với tháng trước`,
        trend: stats.revenueGrowth >= 0 ? 'up' : 'down',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      },
      {
        title: 'Đơn hàng',
        value: stats.totalOrders.toString(),
        subtext: `${stats.ordersGrowth >= 0 ? '↑' : '↓'} ${Math.abs(stats.ordersGrowth)}% so với tháng trước`,
        trend: stats.ordersGrowth >= 0 ? 'up' : 'down',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      {
        title: 'Khách hàng',
        value: stats.totalCustomers.toString(),
        subtext: `${stats.customersGrowth >= 0 ? '↑' : '↓'} ${Math.abs(stats.customersGrowth)}% so với tháng trước`,
        trend: stats.customersGrowth >= 0 ? 'up' : 'down',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      {
        title: 'Nhân viên',
        value: stats.totalStaff.toString(),
        subtext: `${stats.staffGrowth >= 0 ? '↑' : '↓'} ${Math.abs(stats.staffGrowth)}% so với tháng trước`,
        trend: stats.staffGrowth >= 0 ? 'up' : 'down',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      }
    ]
  }

  const statsData = getStatsData()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((s, index) => (
        <div
          key={s.title}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <StatCard {...s} />
        </div>
      ))}
    </div>
  )
}

export default StatCards


