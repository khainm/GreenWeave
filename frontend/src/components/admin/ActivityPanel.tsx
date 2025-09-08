import React from 'react'

type Item = {
  name: string
  action: string
  value: string
  time: string
}

const items: Item[] = [
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa bán đơn hàng', value: '42.9 tr', time: 'một giờ trước' },
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa nhập hàng', value: '0 đ', time: 'một giờ trước' },
  { name: 'Minh Khai', action: 'vừa bán đơn hàng', value: '16.9 tr', time: 'một ngày trước' },
  { name: 'Minh Khai', action: 'vừa nhập hàng', value: '0 đ', time: 'một ngày trước' },
  { name: 'Nguyễn Thị Thái Hoa', action: 'vừa bán đơn hàng', value: '44.2 tr', time: '2 ngày trước' }
]

const ActivityPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 font-bold text-lg text-gray-900">Hoạt động gần đây</div>
      <div className="p-6 space-y-5">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h14c0-3.866-3.134-7-7-7z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 leading-relaxed">
                <span className="text-green-600 font-semibold">{it.name}</span> {it.action} với giá trị <span className="font-bold text-gray-900">{it.value}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActivityPanel


