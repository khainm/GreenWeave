import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { CartService, getCartId } from '../services/cartService'
import { OrderService } from '../services/orderService'
import { userAddressService } from '../services/userAddressService'
import { authService } from '../services/authService'
import type { Cart } from '../types/cart'
import type { UserAddress } from '../types/userAddress'
import type { CreateOrderRequest } from '../types/order'

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        setLoading(true)
        
        // Check if user is authenticated
        const currentUser = authService.getUser()
        if (!currentUser) {
          navigate('/login', { replace: true })
          return
        }

        // Load cart
        const cartId = getCartId()
        if (!cartId) {
          setError('Giỏ hàng trống')
          return
        }

        const cartData = await CartService.get(cartId)
        if (!cartData || !cartData.items || cartData.items.length === 0) {
          setError('Giỏ hàng trống')
          return
        }
        setCart(cartData)

        // Load user addresses
        const addressResponse = await userAddressService.getAddresses()
        if (addressResponse.success && addressResponse.addresses) {
          setAddresses(addressResponse.addresses)
          // Auto-select default address
          const defaultAddress = addressResponse.addresses.find((addr: UserAddress) => addr.isDefault)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
          }
        }
      } catch (e) {
        console.error('Error loading checkout data:', e)
        setError('Không thể tải dữ liệu thanh toán')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  const handlePlaceOrder = async () => {
    if (!cart || !selectedAddressId) return

    try {
      setPlacing(true)
      setError(null)

      const currentUser = authService.getUser()
      if (!currentUser) {
        navigate('/login', { replace: true })
        return
      }

      // Prepare order request
      const orderRequest: CreateOrderRequest = {
        customerId: currentUser.id, // Already a string
        shippingAddressId: selectedAddressId, // Already a string (GUID)
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customization: item.colorCode ? { color: item.colorCode } : undefined
        })),
        shippingFee: shippingFee,
        discount: 0,
        notes: notes.trim() || undefined
      }

      const createdOrder = await OrderService.createOrder(orderRequest)
      
      // Clear cart on success
      localStorage.removeItem('gw_cart_id')
      
      // Navigate to payment page
      navigate(`/payment/${createdOrder.id}`, { replace: true })
      
    } catch (e: any) {
      console.error('Error placing order:', e)
      setError(e.message || 'Không thể đặt hàng. Vui lòng thử lại.')
    } finally {
      setPlacing(false)
    }
  }

  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0
  const shippingFee = 30000 // Fixed shipping fee
  const total = subtotal + shippingFee

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-gray-500">Đang tải...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
            {error === 'Giỏ hàng trống' && (
              <div className="mt-2">
                <button onClick={() => navigate('/products')} className="text-green-600 underline">
                  Tiếp tục mua sắm
                </button>
              </div>
            )}
          </div>
        )}

        {cart && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Order items and shipping */}
            <div className="space-y-6">
              {/* Order Items */}
              <div className="border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Sản phẩm đặt hàng</h2>
                <div className="space-y-4">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <div className="font-medium">Sản phẩm #{item.productId}</div>
                        {item.colorCode && (
                          <div className="text-sm text-gray-500">Màu: {item.colorCode}</div>
                        )}
                        <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice * item.quantity)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)} x {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
                {addresses.length === 0 ? (
                  <div className="text-gray-500">
                    <p>Chưa có địa chỉ giao hàng.</p>
                    <button 
                      onClick={() => navigate('/address')}
                      className="text-green-600 underline mt-2"
                    >
                      Thêm địa chỉ mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(address => (
                      <label key={address.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{address.fullName}</div>
                          <div className="text-sm text-gray-600">{address.phoneNumber}</div>
                          <div className="text-sm text-gray-600">
                            {address.addressLine}, {address.ward && `${address.ward}, `}{address.district}, {address.province}
                          </div>
                          {address.isDefault && (
                            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded mt-1">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {notes.length}/500
                </div>
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="border rounded-xl p-6 h-max">
              <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId || !cart?.items?.length}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold"
              >
                {placing ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </button>

              <div className="text-xs text-gray-500 text-center mt-3">
                Bằng việc đặt hàng, bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CheckoutPage