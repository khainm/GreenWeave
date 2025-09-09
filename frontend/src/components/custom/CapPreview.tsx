import React, { useState } from 'react'

interface CapPreviewProps {
  selectedColor: string
  selectedPattern: string
  onAngleChange: (angle: string) => void
}

const CapPreview: React.FC<CapPreviewProps> = ({ selectedColor, selectedPattern, onAngleChange }) => {
  const [activeAngle, setActiveAngle] = useState('front')

  const angles = [
    { id: 'front', name: 'Mặt trước', image: '🎩' },
    { id: 'side', name: 'Mặt bên', image: '🧢' },
    { id: 'back', name: 'Mặt sau', image: '👒' }
  ]

  const handleAngleClick = (angleId: string) => {
    setActiveAngle(angleId)
    onAngleChange(angleId)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Thiết kế của bạn</h3>
      
      {/* Main Preview */}
      <div className="relative mb-6">
        <div 
          className="w-64 h-64 mx-auto rounded-full border-4 border-gray-300 flex items-center justify-center text-8xl transition-all duration-300"
          style={{ 
            backgroundColor: selectedColor,
            color: selectedColor === '#ffffff' ? '#000000' : '#ffffff'
          }}
        >
          {angles.find(a => a.id === activeAngle)?.image || '🎩'}
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="text-4xl opacity-80"
            style={{ color: selectedColor === '#ffffff' ? '#000000' : '#ffffff' }}
          >
            {selectedPattern === 'solid' ? '●' : 
             selectedPattern === 'black' ? '●' :
             selectedPattern === 'blue' ? '●' :
             selectedPattern === 'red' ? '●' :
             selectedPattern === 'green' ? '●' : '●'}
          </div>
        </div>
      </div>

      {/* Angle Views */}
      <div className="flex justify-center gap-4">
        {angles.map((angle) => (
          <button
            key={angle.id}
            onClick={() => handleAngleClick(angle.id)}
            className={`w-16 h-16 rounded-lg border-2 transition-all flex items-center justify-center text-2xl ${
              activeAngle === angle.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
            }`}
            title={angle.name}
          >
            {angle.image}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CapPreview
