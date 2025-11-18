import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Zap, Package, Leaf, Star, TrendingUp, Shield } from 'lucide-react'
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null) // Track selected image by index (null = auto by color)
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

  // Hiển thị ảnh dựa trên selectedImageIndex (ưu tiên) hoặc selectedColor (fallback)
  const imageUrl = useMemo(() => {
    if (!images.length) return ''
    
    // Nếu đã chọn ảnh cụ thể qua thumbnail, dùng index đó
    if (selectedImageIndex !== null && selectedImageIndex >= 0 && selectedImageIndex < images.length) {
      return images[selectedImageIndex].imageUrl
    }
    
    // Fallback: Tìm ảnh theo màu đã chọn
    if (selectedColor) {
      const colorImage = images.find(img => img.colorCode?.toLowerCase() === selectedColor.toLowerCase())
      if (colorImage) return colorImage.imageUrl
    }
    
    // Default: Ảnh primary hoặc ảnh đầu tiên
    const primary = images.find(i => i.isPrimary)
    return (primary || images[0]).imageUrl
  }, [images, selectedImageIndex, selectedColor])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb với style đẹp hơn */}
        <div className="mb-8">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại Sản phẩm</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải thông tin sản phẩm...</p>
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Images với gallery đẹp hơn */}
            <div className="space-y-4">
              {/* Nhãn hot/sale */}
              <div className="relative">
                {product.originalPrice && product.price && product.originalPrice > product.price && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
                    <TrendingUp size={16} />
                    <span>GIẢM {Math.round((1 - (product.price / product.originalPrice)) * 100)}%</span>
                  </div>
                )}
                {(product.stock ?? 0) > 0 && (product.stock ?? 0) < 10 && (
                  <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                    Sắp hết hàng!
                  </div>
                )}
                
                {/* Main Image */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="aspect-square flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="max-h-full w-auto object-contain hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="text-gray-300 text-center">
                        <Package size={64} className="mx-auto mb-2" />
                        <p>Chưa có ảnh</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <button 
                      key={img.id} 
                      onClick={() => setSelectedImageIndex(idx)} 
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
                        selectedImageIndex === idx 
                          ? 'border-green-500 ring-4 ring-green-100 shadow-lg' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <img src={img.imageUrl} alt={`${product.name} - ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <Shield size={24} className="mx-auto mb-2 text-green-600" />
                  <p className="text-xs font-medium text-gray-700">Bảo hành chất lượng</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Zap size={24} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-xs font-medium text-gray-700">Giao hàng nhanh</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <Leaf size={24} className="mx-auto mb-2 text-emerald-600" />
                  <p className="text-xs font-medium text-gray-700">100% thân thiện môi trường</p>
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Product Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="#FCD34D" stroke="#FCD34D" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(128 đánh giá)</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>
              )}

              {/* Price Section - Eye-catching */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-green-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price ?? 0)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.originalPrice && product.price && product.originalPrice > product.price && (
                  <p className="text-sm text-green-700 mt-2 font-medium">
                    🎉 Tiết kiệm được {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice - product.price)}
                  </p>
                )}
              </div>

              {/* Colors với style đẹp hơn */}
              {colors.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🎨 Màu sắc có sẵn
                  </div>
                  <div className="flex items-center gap-3">
                    {colors.map((c) => {
                      const isSelected = selectedColor.toLowerCase() === c.colorCode.toLowerCase()
                      const ringClass = isSelected 
                        ? 'ring-4 ring-green-500 ring-offset-2 scale-110' 
                        : 'ring-2 ring-gray-200 hover:ring-green-300'
                      const light = ['#ffffff', '#f5f5dc'].includes(c.colorCode.toLowerCase()) ? 'border border-gray-300' : ''
                      return (
                        <button 
                          key={c.id} 
                          onClick={() => {
                            setSelectedColor(c.colorCode)
                            const colorImageIdx = images.findIndex(img => img.colorCode?.toLowerCase() === c.colorCode.toLowerCase())
                            if (colorImageIdx !== -1) {
                              setSelectedImageIndex(colorImageIdx)
                            }
                          }} 
                          className={`w-10 h-10 rounded-full transition-all duration-300 ${ringClass} ${light}`} 
                          style={{ backgroundColor: c.colorCode }}
                          title={c.colorName || c.colorCode}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Product Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tồn kho</p>
                      <p className="font-bold text-gray-900">{product.stock ?? 0} sản phẩm</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Leaf size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Khối lượng</p>
                      <p className="font-bold text-gray-900">{product.weight ?? 0}g</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selector - Improved */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🔢 Số lượng
                </div>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                      className="px-5 py-3 text-gray-700 hover:bg-gray-100 font-bold text-lg transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input 
                      value={quantity} 
                      onChange={e => setQuantity(Math.max(1, Math.min(product.stock ?? 0, Number(e.target.value) || 1)))} 
                      className="w-16 text-center outline-none font-bold text-lg" 
                      max={product.stock ?? 0}
                    />
                    <button 
                      onClick={() => setQuantity(q => Math.min(product?.stock ?? 1, q + 1))} 
                      className="px-5 py-3 text-gray-700 hover:bg-gray-100 font-bold text-lg transition-colors disabled:opacity-50"
                      disabled={quantity >= (product?.stock ?? 0)}
                    >
                      +
                    </button>
                  </div>
                  {quantity > (product.stock ?? 0) && (
                    <p className="text-red-500 text-sm font-medium">⚠️ Vượt quá tồn kho</p>
                  )}
                </div>
              </div>

              {/* Action Buttons - Eye-catching */}
              <div className="space-y-3 pt-2">
                <button
                  className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                    product.stock === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                  disabled={product.stock === 0}
                  onClick={async () => {
                    if (!product || product.stock === 0) return
                    if (quantity > (product.stock ?? 0)) {
                      alert(`Số lượng không được vượt quá ${product.stock ?? 0} sản phẩm`)
                      return
                    }
                    try {
                      const cartId = await getOrCreateCartId()
                      await CartService.addItem(cartId, { productId: product.id, quantity, unitPrice: product.price ?? 0, colorCode: selectedColor || undefined })
                      window.dispatchEvent(new CustomEvent('cart:updated'))
                      
                      // Success animation
                      const btn = document.activeElement as HTMLButtonElement
                      if (btn) {
                        btn.innerHTML = '✓ Đã thêm vào giỏ!'
                        setTimeout(() => {
                          btn.innerHTML = `<svg class="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>Thêm vào giỏ hàng`
                        }, 1500)
                      }
                    } catch (error: any) {
                      console.error('Error adding to cart:', error)
                      alert('Không thể thêm vào giỏ hàng: ' + (error.message || 'Lỗi không xác định'))
                    }
                  }}
                >
                  {product.stock === 0 ? (
                    '❌ Hết hàng'
                  ) : (
                    <>
                      <ShoppingCart size={22} />
                      Thêm vào giỏ hàng
                    </>
                  )}
                </button>
                
                <button 
                  className={`w-full px-6 py-4 rounded-xl border-2 font-bold text-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                    product.stock === 0 
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                      : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white shadow-md hover:shadow-lg'
                  }`}
                  disabled={product.stock === 0}
                  onClick={async () => {
                    if (!product || product.stock === 0) return
                    if (quantity > (product.stock ?? 0)) {
                      alert(`Số lượng không được vượt quá ${product.stock ?? 0} sản phẩm`)
                      return
                    }
                    try {
                      const cartId = await getOrCreateCartId()
                      await CartService.addItem(cartId, { productId: product.id, quantity, unitPrice: product.price ?? 0, colorCode: selectedColor || undefined })
                      window.location.href = '/checkout'
                    } catch (error: any) {
                      console.error('Error adding to cart:', error)
                      alert('Không thể thêm vào giỏ hàng: ' + (error.message || 'Lỗi không xác định'))
                    }
                  }}
                >
                  <Zap size={22} />
                  Mua ngay
                </button>
              </div>

              {/* Urgency Message */}
              {(product.stock ?? 0) > 0 && (product.stock ?? 0) < 10 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                  <p className="text-orange-800 font-medium flex items-center gap-2">
                    ⚡ Chỉ còn {product.stock} sản phẩm! Đặt hàng ngay để không bỏ lỡ!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default ProductDetail


