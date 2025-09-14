import React from 'react'
import type { Product } from '../../../types/product'
import type { ProductFormValues } from '../ProductForm'
import { formatVnd } from '../../../utils/format'

interface ProductPreviewProps {
  form: ProductFormValues
  product: Product | null
  isCustomProduct: boolean
}

const ProductPreview: React.FC<ProductPreviewProps> = ({
  form,
  product,
  isCustomProduct
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Xem trước sản phẩm</h2>
      <div className="max-w-sm mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative h-64 bg-gray-100">
            {form.images[0] ? (
              <img
                src={form.images[0]}
                alt={form.name || 'Sản phẩm'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {isCustomProduct && product?.stickers && product.stickers.length > 0 && (
              <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.stickers.length} stickers
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              {form.name || 'Tên sản phẩm'}
            </h3>
            {form.description && (
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {form.description}
              </p>
            )}
            <div className="mb-3">
              <span className="text-green-600 font-bold text-base">
                {formatVnd(form.price)} đ
              </span>
              {form.originalPrice > 0 && form.originalPrice > form.price && (
                <span className="text-gray-400 text-sm line-through ml-2">
                  {formatVnd(form.originalPrice)} đ
                </span>
              )}
            </div>
            
            {/* Stickers info for custom products */}
            {isCustomProduct && product?.stickers && product.stickers.length > 0 && (
              <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-700 font-medium mb-1">
                  Stickers có sẵn:
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.stickers.slice(0, 3).map((sticker, idx) => (
                    <div key={idx} className="w-6 h-6 bg-white border border-purple-200 rounded flex items-center justify-center">
                      <img 
                        src={sticker.imageUrl} 
                        alt={`sticker-${idx}`}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ))}
                  {product.stickers.length > 3 && (
                    <div className="w-6 h-6 bg-purple-200 text-purple-600 text-xs flex items-center justify-center rounded">
                      +{product.stickers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPreview