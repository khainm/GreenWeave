import React from 'react'

type Stat = {
  title: string
  value: string
  subtext: string
  trend: 'up' | 'down'
}

const Indicator: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => (
  <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
    {trend === 'up' ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5H7z"/></svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>
    )}
  </div>
)

const StatCard: React.FC<Stat> = ({ title, value, subtext, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="text-gray-600 text-sm font-medium mb-3">{title}</div>
    <div className="flex items-center justify-between">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <Indicator trend={trend} />
    </div>
    <div className={`mt-3 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{subtext}</div>
  </div>
)

const StatCards: React.FC = () => {
  const stats: Stat[] = [
    { title: 'Tổng doanh thu', value: '890,000', subtext: '↑ +12.5% so với tháng trước', trend: 'up' },
    { title: 'Đơn hàng', value: '10', subtext: '↑ +8.2% so với tháng trước', trend: 'up' },
    { title: 'Khách hàng', value: '20', subtext: '↑ +15.1% so với tháng trước', trend: 'up' },
    { title: 'Tăng trưởng', value: '23.4%', subtext: '↓ -2.1% so với tháng trước', trend: 'down' }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <StatCard key={s.title} {...s} />
      ))}
    </div>
  )
}

export default StatCards


