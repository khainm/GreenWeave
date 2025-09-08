import React, { useMemo, useState } from 'react'

type TabKey = 'day' | 'hour' | 'weekday'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'hour', label: 'Theo giờ' },
  { key: 'weekday', label: 'Theo thứ' }
]

const months = ['Tháng này', 'Tháng trước', '3 tháng gần đây']

const generateData = (count: number) => Array.from({ length: count }, () => Math.floor(Math.random() * 60) + 5)

const RevenueChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('day')
  const [month, setMonth] = useState(0)

  const data = useMemo(() => {
    if (activeTab === 'day') return generateData(30)
    if (activeTab === 'hour') return generateData(24)
    return generateData(7)
  }, [activeTab, month])

  const max = Math.max(...data)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-xl font-bold text-gray-900">Doanh thu thuần</div>
        <div className="flex items-center space-x-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))} 
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === t.key ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-80">
        <div className="relative h-full flex items-end space-x-1">
          {data.map((v, idx) => (
            <div 
              key={idx} 
              className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm hover:from-green-700 hover:to-green-500 transition-colors" 
              style={{ height: `${(v / max) * 100}%` }} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RevenueChart


