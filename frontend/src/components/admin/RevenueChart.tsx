import React, { useMemo, useState, useEffect } from 'react'
import type { DashboardRevenueData } from '../../services/dashboardService'

type TabKey = 'day' | 'hour' | 'weekday'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'hour', label: 'Theo giờ' },
  { key: 'weekday', label: 'Theo thứ' }
]

const months = ['Tháng này', 'Tháng trước', '3 tháng gần đây']

const generateData = (count: number) => Array.from({ length: count }, () => Math.floor(Math.random() * 60) + 5)

interface RevenueChartProps {
  data?: DashboardRevenueData[]
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('day')
  const [month, setMonth] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const chartData = useMemo(() => {
    if (data.length === 0) {
      // Fallback to mock data if no real data
      if (activeTab === 'day') return generateData(30)
      if (activeTab === 'hour') return generateData(24)
      return generateData(7)
    }
    
    // Use real data
    return data.map(item => item.revenue / 1000) // Convert to thousands for display
  }, [data, activeTab, month])

  const max = Math.max(...chartData)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 600)
    return () => clearTimeout(timer)
  }, [activeTab, month])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">Doanh thu thuần</div>
            <div className="text-sm text-gray-500">Biểu đồ thống kê doanh thu</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))} 
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-green-300"
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-8 mb-6">
        {tabs.map((t) => (
          <button 
            key={t.key} 
            onClick={() => setActiveTab(t.key)} 
            className={`pb-3 text-sm font-medium transition-all duration-200 relative ${
              activeTab === t.key 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-80 relative">
        <div className="absolute inset-0 flex items-end space-x-1">
          {chartData.map((v, idx) => (
            <div 
              key={idx} 
              className={`flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm hover:from-green-700 hover:to-green-500 transition-all duration-500 hover:scale-105 cursor-pointer group relative ${
                isAnimating ? 'animate-pulse' : ''
              }`}
              style={{ 
                height: `${(v / max) * 100}%`,
                animationDelay: `${idx * 20}ms`
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {v}K
              </div>
            </div>
          ))}
        </div>
        
        {/* Chart overlay with grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((percent, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-full h-px bg-gray-100"></div>
                <div className="ml-2 text-xs text-gray-400">{percent}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RevenueChart


