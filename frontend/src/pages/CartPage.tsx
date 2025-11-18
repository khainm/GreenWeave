import React, { useEffect, useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import Header from '../components/layout/Header'
import { CartService, getOrCreateCartId, getCartId } from '../services/cartService'
import ProductService from '../services/productService'
import type { Cart, CartItem } from '../types/cart'
import type { Product } from '../types/product'
import { Link, useNavigate } from 'react-router-dom'

interface CartItemWithProduct extends CartItem {
  product?: Product
}

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  const refresh = async () => {
    try {
      setError(null)
      setLoading(true)
      const id = getCartId() || await getOrCreateCartId()
      const c = await CartService.get(id)
      setCart(c)
      
      // Fetch product details for each cart item
      if (c?.items) {
        const itemsWithProducts = await Promise.all(
          c.items.map(async (item) => {
            try {
              const product = await ProductService.getProductById(item.productId)
              return { ...item, product }
            } catch (err) {
              console.error(`Failed to fetch product ${item.productId}:`, err)
              return { ...item, product: undefined }
            }
          })
        )
        setCartItems(itemsWithProducts)
        
        // Auto-select all items on first load
        setSelectedItems(new Set(c.items.map(item => item.id)))
      }
    } catch (e) {
      setError('Không thể tải giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const updateQty = async (item: CartItemWithProduct, qty: number) => {
    const id = getCartId()
    if (!id) return
    await CartService.updateItem(id, item.id, qty)
    await refresh()
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }

  const removeItem = async (item: CartItemWithProduct) => {
    const id = getCartId()
    if (!id) return
    await CartService.removeItem(id, item.id)
    await refresh()
    window.dispatchEvent(new CustomEvent('cart:updated'))
    // Remove from selected items
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(item.id)
      return newSet
    })
  }

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (cartItems.length > 0) {
      if (selectedItems.size === cartItems.length) {
        setSelectedItems(new Set())
      } else {
        setSelectedItems(new Set(cartItems.map(item => item.id)))
      }
    }
  }

  const selectedItemsData = cartItems.filter(item => selectedItems.has(item.id))
  const total = selectedItemsData.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const totalItems = selectedItemsData.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors group mb-4"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Tiếp tục mua sắm</span>
          </Link>
          <div className="flex items-center gap-3">
            <ShoppingCart size={32} className="text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
            {cartItems.length > 0 && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {cartItems.length} sản phẩm
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 shadow-sm flex items-center gap-3">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải giỏ hàng...</p>
            </div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={64} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
            <Link 
              to="/products" 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <ShoppingBag size={20} />
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <input
                  type="checkbox"
                  checked={cartItems.length > 0 && selectedItems.size === cartItems.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                />
                <span className="font-semibold text-gray-900">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </span>
              </div>

              {/* Cart Items List */}
              {cartItems.map(item => {
                const isSelected = selectedItems.has(item.id)
                const product = item.product
                
                // Get product image
                const productImage = product?.images?.find(img => {
                  // Match color if specified
                  if (item.colorCode && img.colorCode) {
                    return img.colorCode.toLowerCase() === item.colorCode.toLowerCase()
                  }
                  // Otherwise use primary image
                  return img.isPrimary
                }) || product?.images?.[0]
                
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white border-2 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md ${
                      isSelected ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer mt-1"
                      />

                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {productImage?.imageUrl ? (
                          <img 
                            src={productImage.imageUrl} 
                            alt={product?.name || 'Sản phẩm'} 
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Package size={32} className="text-gray-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {product?.name || `Sản phẩm #${item.productId}`}
                        </h3>
                        {item.colorCode && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Màu:</span>
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-gray-300" 
                              style={{ backgroundColor: item.colorCode }}
                            />
                            <span className="text-sm font-medium text-gray-700">{item.colorCode}</span>
                          </div>
                        )}
                        <div className="text-lg font-bold text-green-600 mb-3">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex items-center gap-4">
                          {/* Quantity Selector */}
                          <div className="inline-flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                            <button 
                              onClick={() => updateQty(item, Math.max(1, item.quantity - 1))} 
                              className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <input 
                              value={item.quantity} 
                              onChange={(e) => updateQty(item, Math.max(1, Number(e.target.value) || 1))} 
                              className="w-12 text-center outline-none font-semibold" 
                            />
                            <button 
                              onClick={() => updateQty(item, item.quantity + 1)} 
                              className="px-3 py-2 hover:bg-gray-100 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button 
                            onClick={() => {
                              if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                                removeItem(item)
                              }
                            }}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                          >
                            <Trash2 size={18} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Thành tiền</div>
                        <div className="text-xl font-bold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={24} className="text-green-600" />
                  Thông tin đơn hàng
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Số sản phẩm đã chọn</span>
                    <span className="font-semibold">{selectedItemsData.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tổng số lượng</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-gray-600 mb-2">
                      <span>Tạm tính</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 mb-2">
                      <span>Phí vận chuyển</span>
                      <span className="text-green-600 font-semibold">Miễn phí</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                    </span>
                  </div>
                </div>

                {selectedItemsData.length === 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-orange-700 text-sm text-center font-medium">
                      ⚠️ Vui lòng chọn ít nhất 1 sản phẩm
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <p className="text-green-700 text-sm text-center font-medium">
                      ✓ Đã chọn {selectedItemsData.length} sản phẩm
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (selectedItemsData.length === 0) {
                      alert('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán')
                      return
                    }
                    // Save selected item IDs to localStorage before navigating
                    const selectedIds = Array.from(selectedItems)
                    localStorage.setItem('checkout_selected_items', JSON.stringify(selectedIds))
                    navigate('/checkout')
                  }}
                  disabled={selectedItemsData.length === 0}
                  className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                    selectedItemsData.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <ShoppingBag size={22} />
                  Tiến hành thanh toán
                </button>

                {/* Trust Badges */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Miễn phí vận chuyển toàn quốc</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Đổi trả trong 7 ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CartPage


