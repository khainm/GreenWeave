import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import ShippingProviderSelector from '../components/shipping/ShippingProviderSelector';
import { AddressValidator } from '../utils/addressValidator';
import type { 
  ShippingOption, 
  UserAddress,
  CartItem,
  PaymentMethod
} from '../types';
import OrderService from '../services/orderService';
import { userAddressService } from '../services/userAddressService';
import { CartService, getOrCreateCartId } from '../services/cartService';

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CashOnDelivery');
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    loadCheckoutData();
    // Subscribe to stock changes to refresh cart state when an item's availability changes
    const onStockChanged = (e: any) => {
      try {
        const detail = e?.detail as { productId: number; availableStock: number } | undefined
        if (!detail) return
        // If cart contains the product, reload checkout data
        if (cartItems.some(ci => ci.productId === detail.productId)) {
          loadCheckoutData();
        }
      } catch (err) {
        console.error('Error handling stock change in CheckoutPage', err)
      }
    }
    window.addEventListener('stock:changed', onStockChanged as EventListener)
    return () => {
      window.removeEventListener('stock:changed', onStockChanged as EventListener)
    }
  }, [user, navigate]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Load cart items and addresses in parallel
      const cartId = await getOrCreateCartId();
      const [cartData, addressData] = await Promise.all([
        CartService.get(cartId),
        userAddressService.getAddresses()
      ]);
      
      setCartItems(cartData.items || []);
      // addressData is UserAddressResponse, need to extract addresses
      if (addressData.success && addressData.addresses) {
        setAddresses(addressData.addresses);
      }
      
      // Auto-select default address
      if (addressData.success && addressData.addresses) {
        const defaultAddress = addressData.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
      
    } catch (err) {
      setError('Không thể tải thông tin checkout');
      console.error('Error loading checkout data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const total = subtotal + shippingFee;

  // Get selected address
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  // Create e-commerce shipping fee request (warehouse → customer)
  const createEcommerceShippingRequest = (): any | null => {
    if (!selectedAddress) return null;

    return {
      toAddress: {
        name: selectedAddress.fullName,
        phone: selectedAddress.phoneNumber,
        addressDetail: selectedAddress.addressLine,
        ward: selectedAddress.ward || '',
        district: selectedAddress.district,
        province: selectedAddress.province
      },
      weight: getTotalWeight(),
      insuranceValue: subtotal,
      codAmount: paymentMethod === 'CashOnDelivery' ? total : 0
    };
  };

  const getTotalWeight = (): number => {
    // Calculate total weight based on cart items
    // For now, assume 500g per item
    return cartItems.reduce((sum, item) => sum + (item.quantity * 500), 0);
  };

  const handleOptionSelect = (option: ShippingOption) => {
    setSelectedShippingOption(option);
    setShippingFee(option.fee);
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    
    // Validate selected address
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      const validation = AddressValidator.validateForCheckout({
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        addressLine: address.addressLine,
        ward: address.ward,
        district: address.district,
        province: address.province
      });
      
      setAddressValidation(validation);
      
      // Show validation messages immediately
      if (!validation.isValid) {
        setError(`Địa chỉ giao hàng không hợp lệ: ${validation.errors.join(', ')}`);
      } else if (validation.warnings.length > 0) {
        // Clear errors but could show warnings in UI
        setError(null);
      } else {
        setError(null);
      }
    } else {
      setAddressValidation({ isValid: true, errors: [], warnings: [] });
    }
    
    // Reset shipping selection when address changes
    setSelectedShippingOption(null);
    setShippingFee(0);
  };

  const validateCheckoutData = (): string | null => {
    // Basic validation
    if (!selectedAddress || !selectedShippingOption || !user) {
      return 'Vui lòng chọn địa chỉ giao hàng và phương thức vận chuyển';
    }

    if (cartItems.length === 0) {
      return 'Giỏ hàng trống';
    }

    // Address validation
    const validation = AddressValidator.validateForCheckout({
      fullName: selectedAddress.fullName,
      phoneNumber: selectedAddress.phoneNumber,
      addressLine: selectedAddress.addressLine,
      ward: selectedAddress.ward,
      district: selectedAddress.district,
      province: selectedAddress.province
    });

    if (!validation.isValid) {
      return `Địa chỉ giao hàng không hợp lệ:\n${validation.errors.join('\n')}`;
    }

    // Stock validation
    for (const item of cartItems) {
      if (item.quantity <= 0) {
        return `Số lượng sản phẩm #${item.productId} không hợp lệ`;
      }
    }

    return null;
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);

    // Comprehensive validation
    const validationError = validateCheckoutData();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    // Safe access with non-null assertion after validation
    const validUser = user!;
    const validAddress = selectedAddress!;
    const validShipping = selectedShippingOption!;

    try {
      // Create order
      const orderData = {
        customerId: validUser.id,
        shippingAddressId: validAddress.id,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customization: undefined
        })),
        shippingFee: shippingFee,
        discount: 0,
        notes: orderNotes,
        shippingProvider: validShipping.provider,
        shippingServiceId: validShipping.serviceId,
        paymentMethod: paymentMethod
      };

      const order = await OrderService.createOrder(orderData);

      // If PayOS selected, use order payment endpoint to get payment link
      if (paymentMethod === 'PayOS') {
        try {
          const paymentResponse = await OrderService.payOrder(order.id);
          
          // Backend returns { success: true, paymentUrl: "..." } for PayOS orders
          if (paymentResponse && 'paymentUrl' in paymentResponse) {
            // Clear cart before redirect
            localStorage.removeItem('gw_cart_id');
            window.location.href = (paymentResponse as any).paymentUrl;
            return;
          } else {
            setError('Không nhận được link thanh toán từ PayOS. Vui lòng thử lại.');
            return;
          }
        } catch (err) {
          console.error('Error creating PayOS payment link', err);
          setError('Không thể khởi tạo liên kết thanh toán PayOS. Vui lòng thử lại sau.');
          return;
        }
      }

      // Clear cart after successful order (non-PayOS flows or if PayOS link not returned)
      localStorage.removeItem('gw_cart_id');

      // Navigate to order success page
      navigate(`/orders/${order.id}`, { 
        state: { 
          message: 'Đặt hàng thành công! Đơn hàng của bạn đang chờ xác nhận.' 
        }
      });
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đặt hàng');
      console.error('Error creating order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h1>
            <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

        const shippingRequest = createEcommerceShippingRequest();  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ giao hàng</p>
                  <button
                    onClick={() => navigate('/addresses')}
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    // Check validation for this address
                    const addressValidation = AddressValidator.validateForCheckout({
                      fullName: address.fullName,
                      phoneNumber: address.phoneNumber,
                      addressLine: address.addressLine,
                      ward: address.ward,
                      district: address.district,
                      province: address.province
                    });
                    
                    const isSelected = selectedAddressId === address.id;
                    const hasErrors = !addressValidation.isValid;
                    const hasWarnings = addressValidation.warnings.length > 0;
                    
                    return (
                      <label
                        key={address.id}
                        className={`
                          relative flex items-start p-4 border rounded-lg cursor-pointer transition-all
                          ${isSelected && !hasErrors
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                            : isSelected && hasErrors
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : hasErrors
                            ? 'border-red-300 bg-red-25'
                            : hasWarnings
                            ? 'border-yellow-300 bg-yellow-25'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="shipping-address"
                          value={address.id}
                          checked={isSelected}
                          onChange={() => handleAddressChange(address.id)}
                          className="sr-only"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{address.fullName}</h3>
                            {address.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                Mặc định
                              </span>
                            )}
                            {hasErrors && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                Lỗi
                              </span>
                            )}
                            {!hasErrors && hasWarnings && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                Cảnh báo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                          <p className="text-sm text-gray-600">
                            {address.addressLine}, {address.ward && `${address.ward}, `}
                            {address.district}, {address.province}
                          </p>
                          
                          {/* Validation Messages */}
                          {isSelected && hasErrors && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                              <p className="text-red-800 font-medium">Địa chỉ không hợp lệ:</p>
                              <ul className="text-red-700 list-disc list-inside">
                                {addressValidation.errors.map((error, idx) => (
                                  <li key={idx}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {isSelected && !hasErrors && hasWarnings && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <p className="text-yellow-800 font-medium">Lưu ý:</p>
                              <ul className="text-yellow-700 list-disc list-inside">
                                {addressValidation.warnings.map((warning, idx) => (
                                  <li key={idx}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Custom radio indicator */}
                        <div className={`
                          w-4 h-4 rounded-full border-2 transition-all flex-shrink-0
                          ${isSelected && !hasErrors
                            ? 'border-green-500 bg-green-500'
                            : isSelected && hasErrors
                            ? 'border-red-500 bg-red-500'
                            : hasErrors
                            ? 'border-red-400'
                            : hasWarnings
                            ? 'border-yellow-400'
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                  
                  <button
                    onClick={() => navigate('/addresses')}
                    className="w-full text-center text-green-600 hover:text-green-700 underline py-2"
                  >
                    Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </div>

            {/* Auto-selected Warehouse Display (Information Only) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">📦 Điểm gửi hàng</h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 10-10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">🤖 Được chọn tự động</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Hệ thống đã tự động chọn kho hàng tối ưu nhất dựa trên:
                    </p>
                    <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
                      <li>Khoảng cách đến địa chỉ của bạn</li>
                      <li>Tình trạng tồn kho sản phẩm</li>
                      <li>Thời gian giao hàng nhanh nhất</li>
                      <li>Chi phí vận chuyển tối ưu</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

        {/* Shipping Provider */}
        {selectedAddress && shippingRequest && (
          <div className="bg-white p-6 rounded-lg shadow">
            <ShippingProviderSelector
              request={shippingRequest}
              selectedOption={selectedShippingOption}
              onOptionSelect={handleOptionSelect}
            />
          </div>
        )}

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
              
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className={`
                  relative flex items-start p-4 border rounded-lg cursor-pointer transition-all
                  ${paymentMethod === 'CashOnDelivery'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="CashOnDelivery"
                    checked={paymentMethod === 'CashOnDelivery'}
                    onChange={() => setPaymentMethod('CashOnDelivery')}
                    className="sr-only"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng. ViettelPost sẽ thu hộ và chuyển tiền về tài khoản của chúng tôi.
                    </p>
                  </div>
                  
                  {/* Custom radio indicator */}
                  <div className={`
                    w-4 h-4 rounded-full border-2 transition-all
                    ${paymentMethod === 'CashOnDelivery'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {paymentMethod === 'CashOnDelivery' && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </label>

                {/* Bank Transfer option intentionally removed per product requirement */}

                {/* PayOS */}
                <label className={`
                  relative flex items-start p-4 border rounded-lg cursor-pointer transition-all
                  ${paymentMethod === 'PayOS'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="PayOS"
                    checked={paymentMethod === 'PayOS'}
                    onChange={() => setPaymentMethod('PayOS')}
                    className="sr-only"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Thanh toán qua PayOS</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Thanh toán trực tuyến qua cổng PayOS. Sau khi thanh toán thành công, đơn hàng sẽ được xác nhận tự động nếu cấu hình cho phép.
                    </p>
                  </div>

                  {/* Custom radio indicator */}
                  <div className={`
                    w-4 h-4 rounded-full border-2 transition-all
                    ${paymentMethod === 'PayOS'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {paymentMethod === 'PayOS' && (
                      <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Ghi chú đơn hàng</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Ghi chú đặc biệt cho đơn hàng (không bắt buộc)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-2">
                {orderNotes.length}/500 ký tự
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow h-fit sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.colorCode || 'default'}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      Product #{item.productId}
                    </h4>
                    <p className="text-sm text-gray-600">
                      SL: {item.quantity} × {item.unitPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển:</span>
                <span>
                  {shippingFee > 0 
                    ? `${shippingFee.toLocaleString('vi-VN')}đ`
                    : 'Miễn phí'
                  }
                </span>
              </div>
              
              {selectedShippingOption && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>({selectedShippingOption.providerName})</span>
                </div>
              )}
              
              <hr className="my-2" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-green-600">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Payment Method Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">Phương thức thanh toán:</span>
              </div>
              <p className="text-sm text-gray-600">
                {paymentMethod === 'CashOnDelivery' 
                  ? 'Thanh toán khi nhận hàng (COD)' 
                  : 'Thanh toán chuyển khoản'
                }
              </p>
              {paymentMethod === 'CashOnDelivery' && (
                <p className="text-xs text-gray-500 mt-1">
                  ViettelPost sẽ thu hộ {total.toLocaleString('vi-VN')}đ khi giao hàng
                </p>
              )}
            </div>

            {/* Address Validation Summary */}
            {selectedAddress && (
              (() => {
                const validation = AddressValidator.validateForCheckout({
                  fullName: selectedAddress.fullName,
                  phoneNumber: selectedAddress.phoneNumber,
                  addressLine: selectedAddress.addressLine,
                  ward: selectedAddress.ward,
                  district: selectedAddress.district,
                  province: selectedAddress.province
                });
                
                if (!validation.isValid) {
                  return (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-red-800">Địa chỉ giao hàng có vấn đề</span>
                      </div>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {validation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  );
                } else if (validation.warnings.length > 0) {
                  return (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-800">Lưu ý về địa chỉ giao hàng</span>
                      </div>
                      <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                        {validation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">Địa chỉ giao hàng hợp lệ</span>
                      </div>
                    </div>
                  );
                }
              })()
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={!selectedAddress || !selectedShippingOption || submitting || !addressValidation.isValid}
              className={`
                w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors
                ${selectedAddress && selectedShippingOption && !submitting && addressValidation.isValid
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;