import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import ProductService from '../services/productService'
import type { Product } from '../types/product'
import { CartService, getOrCreateCartId } from '../services/cartService'

const ProductDetail: React.FC = () => {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        setIsLoading(true)
        const p = await ProductService.getProductById(Number(id))
        setProduct(p)
        setSelectedColor(p.colors?.[0]?.colorCode || '')
      } catch (e) {
        setError('Không thể tải sản phẩm')
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // Listen for stock change events and update product state if matching
    const onStockChanged = (e: any) => {
      try {
        const detail = e?.detail as { productId: number; availableStock: number } | undefined
        if (!detail) return
        if (!product) return
        if (detail.productId === product.id) {
          setProduct({ ...product, stock: detail.availableStock })
          // ensure quantity doesn't exceed new stock
          setQuantity(q => Math.min(q, detail.availableStock || 1))
        }
      } catch (err) {
        console.error('Error handling stock change in ProductDetail', err)
      }
    }
    window.addEventListener('stock:changed', onStockChanged as EventListener)
    return () => {
      window.removeEventListener('stock:changed', onStockChanged as EventListener)
    }
  }, [id])

  const images = useMemo(() => product?.images?.slice().sort((a,b)=>a.sortOrder-b.sortOrder) || [], [product])
  const colors = useMemo(() => product?.colors?.slice().sort((a,b)=>a.sortOrder-b.sortOrder) || [], [product])

  const imageUrl = useMemo(() => {
    if (!images.length) return ''
    const colorIndex = colors.findIndex(c => c.colorCode === selectedColor)
    if (colorIndex >= 0 && images[colorIndex]) return images[colorIndex].imageUrl
    const primary = images.find(i => i.isPrimary)
    return (primary || images[0]).imageUrl
  }, [images, colors, selectedColor])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/products" className="text-sm text-gray-600 hover:text-green-700">← Quay lại Sản phẩm</Link>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}
        {isLoading ? (
          <div className="text-gray-500">Đang tải...</div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: images */}
            <div>
              <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="max-h-96 w-auto object-contain" />
                ) : (
                  <div className="text-gray-400">Chưa có ảnh</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.map((img) => (
                    <button key={img.id} onClick={() => setSelectedColor(colors[images.indexOf(img)]?.colorCode || selectedColor)} className={`h-20 rounded-xl overflow-hidden border ${img.imageUrl === imageUrl ? 'border-green-500' : 'border-gray-200'}`}>
                      <img src={img.imageUrl} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {product.description && <p className="text-gray-600 mt-2 leading-7">{product.description}</p>}
              <div className="mt-4">
                <span className="text-green-600 font-bold text-2xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-gray-400 line-through ml-3">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}</span>
                )}
              </div>

              {/* Colors */}
              {colors.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm text-gray-700 mb-2">Màu sắc</div>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => {
                      const isSelected = selectedColor.toLowerCase() === c.colorCode.toLowerCase()
                      const ringClass = isSelected ? 'ring-2 ring-green-500 ring-offset-2' : 'ring-1 ring-gray-200'
                      const light = ['#ffffff', '#f5f5dc'].includes(c.colorCode.toLowerCase()) ? 'border border-gray-200' : ''
                      return (
                        <button key={c.id} onClick={() => setSelectedColor(c.colorCode)} className={`w-6 h-6 rounded-full ${ringClass} ${light}`} style={{ backgroundColor: c.colorCode }} />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Product Info */}
              <div className="mt-6 space-y-4">
                {/* Stock Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tồn kho</span>
                    <span className="font-semibold text-gray-900">{product.stock} sản phẩm</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Khối lượng</span>
                    <span className="font-semibold text-gray-900">{product.weight} gram</span>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <div className="text-sm text-gray-700 mb-2">Số lượng</div>
                  <div className="inline-flex items-center border rounded-lg">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-l-lg"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input 
                      value={quantity} 
                      onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))} 
                      className="w-12 text-center outline-none" 
                      max={product.stock}
                    />
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} 
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-r-lg"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                  {quantity > product.stock && (
                    <p className="text-red-500 text-xs mt-1">Số lượng không được vượt quá tồn kho</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold ${
                    product.stock === 0 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  disabled={product.stock === 0}
                  onClick={async () => {
                    if (!product || product.stock === 0) return
                    if (quantity > product.stock) {
                      alert(`Số lượng không được vượt quá ${product.stock} sản phẩm`)
                      return
                    }
                    try {
                      const cartId = await getOrCreateCartId()
                      await CartService.addItem(cartId, { productId: product.id, quantity, unitPrice: product.price, colorCode: selectedColor || undefined })
                      // Emit a simple event so Header can refresh count later if needed
                      window.dispatchEvent(new CustomEvent('cart:updated'))
                      // Show success message
                      alert('Đã thêm sản phẩm vào giỏ hàng!')
                    } catch (error: any) {
                      console.error('Error adding to cart:', error)
                      alert('Không thể thêm vào giỏ hàng: ' + (error.message || 'Lỗi không xác định'))
                    }
                  }}
                >
                  {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
                <button 
                  className={`px-4 py-3 rounded-xl border ${
                    product.stock === 0 
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  disabled={product.stock === 0}
                  onClick={async () => {
                    if (!product || product.stock === 0) return
                    if (quantity > product.stock) {
                      alert(`Số lượng không được vượt quá ${product.stock} sản phẩm`)
                      return
                    }
                    try {
                      // Add to cart first
                      const cartId = await getOrCreateCartId()
                      await CartService.addItem(cartId, { productId: product.id, quantity, unitPrice: product.price, colorCode: selectedColor || undefined })
                      // Navigate to checkout
                      window.location.href = '/checkout'
                    } catch (error: any) {
                      console.error('Error adding to cart:', error)
                      alert('Không thể thêm vào giỏ hàng: ' + (error.message || 'Lỗi không xác định'))
                    }
                  }}
                >
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default ProductDetail


