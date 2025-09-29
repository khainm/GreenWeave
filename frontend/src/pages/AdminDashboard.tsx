import React, { useState, useEffect } from 'react'
import TopNav from '../components/admin/TopNav'
import StatCards from '../components/admin/StatCards'
import RevenueChart from '../components/admin/RevenueChart'
import ActivityPanel from '../components/admin/ActivityPanel'
import DashboardService, { type DashboardStats, type DashboardActivity, type DashboardRevenueData } from '../services/dashboardService'

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<DashboardRevenueData[]>([])
  const [activities, setActivities] = useState<DashboardActivity[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load all dashboard data in parallel
      const [stats, revenue, activitiesData] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getRevenueData('day'),
        DashboardService.getRecentActivities()
      ])
      
      setDashboardStats(stats)
      setRevenueData(revenue)
      setActivities(activitiesData)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            {/* Loading skeleton for stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
            
            {/* Loading skeleton for chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="h-80 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <TopNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-gray-600">
            Đây là tổng quan về hoạt động kinh doanh của bạn hôm nay
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <div className="flex items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column - Stats and Chart */}
          <div className="xl:col-span-9 space-y-6 lg:space-y-8">
            {/* Stats cards with staggered animation */}
            <div className="animate-slide-up">
              <StatCards stats={dashboardStats} />
            </div>
            
            {/* Revenue chart with delay */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <RevenueChart data={revenueData} />
            </div>
          </div>

          {/* Right column - Activity panel */}
          <div className="xl:col-span-3">
            <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
              <ActivityPanel activities={activities} />
            </div>
          </div>
        </div>

        {/* Quick actions section */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Tạo đơn hàng</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Thêm sản phẩm</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Xem báo cáo</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Quản lý khách hàng</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AdminDashboard


