import React from 'react'
import type { Product } from '../../types/product'

interface StickerPaletteProps {
  selectedProduct: Product | null
  onAddSticker: (stickerUrl: string) => void
}

const StickerPalette: React.FC<StickerPaletteProps> = ({ 
  selectedProduct, 
  onAddSticker 
}) => {
  if (!selectedProduct?.stickers || selectedProduct.stickers.length === 0) {
    return null
  }

  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect group">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 gradient-bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-gradient">Stickers</h3>
          <p className="text-xs text-gray-600 font-medium">Click để thêm</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
        {selectedProduct?.stickers?.sort((a,b)=>a.sortOrder-b.sortOrder).map(s => (
          <button 
            key={s.id} 
            onClick={() => onAddSticker(s.imageUrl)} 
            className="group border-2 border-gray-200/60 rounded-2xl p-2 hover:shadow-lg hover:border-purple-300/60 transition-all duration-500 transform hover:scale-110 bg-white/90 backdrop-blur-sm flex items-center justify-center tooltip click-effect relative overflow-hidden"
            data-tooltip="Click để thêm sticker"
          >
            <img 
              src={s.imageUrl} 
              className="w-8 h-8 object-contain group-hover:scale-125 transition-transform duration-500" 
              alt="Sticker"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default StickerPalette
