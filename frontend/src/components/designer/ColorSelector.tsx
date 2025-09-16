import React from 'react'
import type { Product } from '../../types/product'

interface ColorSelectorProps {
  selectedProduct: Product | null
  productColor: string
  onColorChange: (color: string) => void
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ 
  selectedProduct, 
  productColor, 
  onColorChange 
}) => {
  const colors = selectedProduct?.colors?.map(c => c.colorCode) || ['#ffffff','#000000']

  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect group">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 gradient-bg-accent rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-gradient">Màu sắc</h3>
          <p className="text-xs text-gray-600 font-medium">Chọn màu ảnh</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Màu hiện tại: 
          <span className="ml-1 px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: productColor }}>
            {productColor}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {colors.map(c => (
            <button 
              key={c} 
              onClick={() => onColorChange(c!)} 
              className={`group relative w-10 h-10 rounded-xl border-2 transition-all duration-500 hover:scale-125 hover:shadow-lg transform tooltip click-effect overflow-hidden ${
                productColor===c
                  ? 'border-emerald-400 ring-2 ring-emerald-200/60 shadow-lg scale-110' 
                  : 'border-gray-300/60 hover:border-emerald-300/60'
              }`} 
              style={{ backgroundColor: c }}
              data-tooltip={`Xem ảnh màu ${c}`}
            >
              {productColor === c && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ColorSelector
