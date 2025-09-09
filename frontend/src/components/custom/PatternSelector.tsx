import React from 'react'

interface PatternSelectorProps {
  selectedPattern: string
  onPatternSelect: (patternId: string) => void
}

const patterns = [
  { id: 'solid', name: 'Trơn', color: '#ffffff', icon: '●' },
  { id: 'black', name: 'Đen', color: '#000000', icon: '●' },
  { id: 'blue', name: 'Xanh dương', color: '#3b82f6', icon: '●' },
  { id: 'red', name: 'Đỏ', color: '#ef4444', icon: '●' },
  { id: 'green', name: 'Xanh lá', color: '#10b981', icon: '●' }
]

const PatternSelector: React.FC<PatternSelectorProps> = ({ selectedPattern, onPatternSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Họa tiết</h3>
      <div className="space-y-3">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onPatternSelect(pattern.id)}
            className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
              selectedPattern === pattern.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: pattern.color }}
            >
              {pattern.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{pattern.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PatternSelector
