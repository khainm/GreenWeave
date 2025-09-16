import React, { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import { CartService, getOrCreateCartId, getCartId } from '../services/cartService'
import type { Cart, CartItem } from '../types/cart'
import { Link, useNavigate } from 'react-router-dom'

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setError(null)
      setLoading(true)
      const id = getCartId() || await getOrCreateCartId()
      const c = await CartService.get(id)
      setCart(c)
    } catch (e) {
      setError('Không thể tải giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const updateQty = async (item: CartItem, qty: number) => {
    const id = getCartId()
    if (!id) return
    await CartService.updateItem(id, item.id, qty)
    await refresh()
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }

  const removeItem = async (item: CartItem) => {
    const id = getCartId()
    if (!id) return
    await CartService.removeItem(id, item.id)
    await refresh()
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }

  const total = cart?.items?.reduce((s, i) => s + i.unitPrice * i.quantity, 0) || 0

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}
        {loading ? (
          <div className="text-gray-500">Đang tải...</div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-gray-600">Giỏ hàng trống. <Link to="/products" className="text-green-600">Tiếp tục mua sắm</Link></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-gray-900 font-medium">Sản phẩm #{item.productId}</div>
                    {item.colorCode && <div className="text-sm text-gray-500">Màu: {item.colorCode}</div>}
                    <div className="text-sm text-gray-500">Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center border rounded-lg">
                      <button onClick={() => updateQty(item, Math.max(1, item.quantity - 1))} className="px-3 py-2">-</button>
                      <input value={item.quantity} onChange={(e) => updateQty(item, Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center outline-none" />
                      <button onClick={() => updateQty(item, item.quantity + 1)} className="px-3 py-2">+</button>
                    </div>
                    <button onClick={() => removeItem(item)} className="text-red-600">Xóa</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border rounded-xl p-6 h-max">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Tổng</span>
                <span className="text-xl font-bold text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold"
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CartPage


