import React from 'react'

interface ColorSelectorProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

const colors = [
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Đen', value: '#000000' },
  { name: 'Xanh lá', value: '#10b981' },
  { name: 'Xanh dương', value: '#3b82f6' },
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Vàng', value: '#f59e0b' }
]

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Màu sắc</h3>
      <div className="space-y-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
              selectedColor === color.value 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: color.value }}
            />
            <span className="text-sm font-medium text-gray-700">{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ColorSelector
