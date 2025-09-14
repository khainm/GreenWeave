import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../../types/product'

interface ProductEditHeaderProps {
  product: Product | null
  isCustomProduct: boolean
  onOpenCustomModal?: () => void
}

const ProductEditHeader: React.FC<ProductEditHeaderProps> = ({
  product,
  isCustomProduct,
  onOpenCustomModal
}) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Link 
        to="/admin/products" 
        className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </Link>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa hàng hóa</h1>
        {product && (
          <div className="flex items-center gap-2 mt-1">
            {isCustomProduct ? (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Sản phẩm tùy chỉnh
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Sản phẩm thường
              </span>
            )}
            {product.stickers && product.stickers.length > 0 && (
              <span className="text-xs text-gray-500">
                ({product.stickers.length} stickers)
              </span>
            )}
          </div>
        )}
      </div>
      {isCustomProduct && onOpenCustomModal && (
        <button
          onClick={onOpenCustomModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Chỉnh sửa tùy chỉnh
        </button>
      )}
    </div>
  )
}

export default ProductEditHeader