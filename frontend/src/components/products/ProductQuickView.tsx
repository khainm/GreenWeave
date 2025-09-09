import React, { useEffect, useMemo, useState } from 'react'
import type { Product } from '../../types/product'

type Props = {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (payload: { product: Product; quantity: number; color?: string }) => void
}

const ProductQuickView: React.FC<Props> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  useEffect(() => {
    setSelectedColor(product?.colors?.[0]?.colorCode || '')
  }, [product])

  const orderedImages = useMemo(() => product?.images?.slice().sort((a, b) => a.sortOrder - b.sortOrder) || [], [product])
  const orderedColors = useMemo(() => product?.colors?.slice().sort((a, b) => a.sortOrder - b.sortOrder) || [], [product])

  const imageUrl = useMemo(() => {
    if (!orderedImages.length) return ''
    const colorIndex = orderedColors.findIndex(c => c.colorCode === selectedColor)
    if (colorIndex >= 0 && orderedImages[colorIndex]) return orderedImages[colorIndex].imageUrl
    const primary = orderedImages.find(i => i.isPrimary)
    return (primary || orderedImages[0]).imageUrl
  }, [orderedImages, orderedColors, selectedColor])

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="bg-gray-100 h-80 md:h-full flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="max-h-80 md:max-h-[520px] w-auto object-contain" />
            ) : (
              <div className="text-gray-400">Chưa có ảnh</div>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900 mr-4">{product.name}</h3>
              <button onClick={onClose} aria-label="Đóng" className="text-gray-500 hover:text-gray-700">×</button>
            </div>

            {product.description && (
              <p className="text-gray-600 mt-2 text-sm leading-6 line-clamp-4">{product.description}</p>
            )}

            <div className="mt-4">
              <span className="text-green-600 font-bold text-2xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through ml-3">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}</span>
              )}
            </div>

            {/* Colors */}
            {orderedColors.length > 0 && (
              <div className="mt-5">
                <div className="text-sm text-gray-700 mb-2">Màu sắc</div>
                <div className="flex items-center gap-2">
                  {orderedColors.map((c) => {
                    const isSelected = selectedColor.toLowerCase() === c.colorCode.toLowerCase()
                    const ringClass = isSelected ? 'ring-2 ring-green-500 ring-offset-2' : 'ring-1 ring-gray-200'
                    const light = ['#ffffff', '#f5f5dc'].includes(c.colorCode.toLowerCase()) ? 'border border-gray-200' : ''
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.colorCode)}
                        className={`w-6 h-6 rounded-full ${ringClass} ${light}`}
                        style={{ backgroundColor: c.colorCode }}
                        aria-label={`Chọn màu ${c.colorCode}`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-5">
              <div className="text-sm text-gray-700 mb-2">Số lượng</div>
              <div className="inline-flex items-center border rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-700">-</button>
                <input value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center outline-none" />
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 text-gray-700">+</button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onAddToCart?.({ product, quantity, color: selectedColor })}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Thêm vào giỏ
              </button>
              <button onClick={onClose} className="px-4 py-3 rounded-xl border border-gray-300">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductQuickView


