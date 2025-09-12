import React from 'react'
import type { Product } from '../../types/product'

interface ProductGalleryProps {
  products: Product[]
  selectedProduct: Product | null
  onSelectProduct: (product: Product) => void
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ 
  products, 
  selectedProduct, 
  onSelectProduct 
}) => {
  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect group">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 gradient-bg-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-gradient">Sản phẩm</h3>
          <p className="text-xs text-gray-600 font-medium">Chọn để thiết kế</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto scrollbar-thin">
        {products?.map(p => {
          const thumb = p?.images?.find(i => i.isPrimary)?.imageUrl || p?.images?.[0]?.imageUrl
          const active = selectedProduct?.id === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className={`group w-full border-2 rounded-2xl overflow-hidden text-left transition-all duration-500 transform hover:scale-105 ${
                active 
                  ? 'border-green-400 ring-2 ring-green-200/60 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50' 
                  : 'border-gray-200/50 hover:border-blue-300/60 bg-white/90 backdrop-blur-sm hover:shadow-lg'
              }`}
              title={p.name}
            >
              <div className="relative w-full h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2 overflow-hidden">
                {thumb && (
                  <img 
                    src={thumb} 
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                    alt={p.name}
                    loading="lazy"
                  />
                )}
                {active && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-sm">
                <div className="text-xs font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors">{p.name}</div>
                <div className="text-xs text-gray-600 font-medium bg-gray-100 px-1 py-0.5 rounded inline-block">{p.sku}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProductGallery
