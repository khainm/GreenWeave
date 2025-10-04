import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopNav from '../../components/admin/TopNav'
import ProductService from '../../services/productService'
import OrderService from '../../services/orderService'
import viettelPostAddressService from '../../services/viettelPostAddressService'
import ShippingService from '../../services/shippingService'
import warehouseService from '../../services/warehouseService'
import type { Product } from '../../types/product'
import type { OrderItem } from '../../types/order'
import type { ShippingOption, CalculateShippingFeeRequest } from '../../types/shipping'
import type { Warehouse } from '../../types/warehouse'
// import type { AddressOption } from '../../types/address' // Not found, using any for now

const AdminCreateOrderPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Address data
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [loadingAddress, setLoadingAddress] = useState(false)
  
  // Shipping data
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingFee, setShippingFee] = useState(0)
  
  // Warehouse data
  const [defaultWarehouse, setDefaultWarehouse] = useState<Warehouse | null>(null)
  const [loadingWarehouse, setLoadingWarehouse] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: {
      fullName: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      addressLine: ''
    },
    paymentMethod: 'COD' as 'COD' | 'BANK_TRANSFER',
    note: '',
    items: [] as OrderItem[]
  })

  useEffect(() => {
    if (!user || !['Admin', 'Staff'].includes(user.roles?.[0] || '')) {
      navigate('/')
      return
    }
    
    loadData()
  }, [user, navigate])

  // Auto-calculate shipping fee when items or address change
  useEffect(() => {
    calculateShippingFee()
  }, [formData.items, formData.shippingAddress.province, formData.shippingAddress.district, formData.shippingAddress.ward, formData.paymentMethod, defaultWarehouse])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [productsData, provincesData] = await Promise.all([
        ProductService.getAllProducts(),
        viettelPostAddressService.getProvinces()
      ])
      
      setProducts(productsData)
      // Convert AddressDto[] to {label, value} format
      const provincesFormatted = provincesData.map(province => ({
        label: province.name,
        value: province.id.toString()
      }))
      setProvinces(provincesFormatted)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const loadDefaultWarehouse = async () => {
    try {
      setLoadingWarehouse(true)
      const response = await warehouseService.getDefaultWarehouse()
      if (response.success && response.warehouse) {
        setDefaultWarehouse(response.warehouse)
        console.log('✅ Loaded default warehouse:', response.warehouse)
      } else {
        console.warn('⚠️ No default warehouse found, will use config fallback')
        setDefaultWarehouse(null)
      }
    } catch (err) {
      console.error('❌ Error loading default warehouse:', err)
      // Fallback to config if service fails
      setDefaultWarehouse(null)
    } finally {
      setLoadingWarehouse(false)
    }
  }

  const handleAddProduct = (product: Product) => {
    const existingItem = formData.items.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Tăng số lượng nếu sản phẩm đã có
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }))
    } else {
      // Thêm sản phẩm mới
      const newItem: any = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        customization: undefined
      }
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      // Xóa sản phẩm nếu số lượng = 0
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.productId !== productId)
      }))
    } else {
      // Cập nhật số lượng
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
      }))
    }
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  }

  const calculateTotalWithShipping = () => {
    return calculateTotal() + shippingFee
  }

  // Calculate shipping fee when address or items change
  const calculateShippingFee = async () => {
    if (formData.items.length === 0 || 
        !formData.shippingAddress.province || 
        !formData.shippingAddress.district || 
        !formData.shippingAddress.ward) {
      setShippingOptions([])
      setSelectedShippingOption(null)
      setShippingFee(0)
      return
    }

    setLoadingShipping(true)
    try {
      // Calculate total weight from items
      const totalWeight = formData.items.reduce((weight, item) => {
        const product = products.find(p => p.id === item.productId)
        return weight + (product?.weight || 0) * item.quantity
      }, 0)

      // Get province and district IDs
      const provinceId = provinces.find(p => p.label === formData.shippingAddress.province)?.value
      const districtId = districts.find(d => d.label === formData.shippingAddress.district)?.value

      if (!provinceId || !districtId) {
        console.warn('Province or district ID not found')
        return
      }

      // Build fromAddress based on warehouse data or fallback to config
      const fromAddress = defaultWarehouse ? {
        name: defaultWarehouse.name,
        phone: defaultWarehouse.phone || '0359994361',
        addressDetail: defaultWarehouse.addressDetail,
        province: defaultWarehouse.provinceName,
        district: defaultWarehouse.districtName,
        ward: defaultWarehouse.wardName,
        provinceId: defaultWarehouse.provinceId,
        districtId: defaultWarehouse.districtId,
        wardId: defaultWarehouse.wardId
      } : {
        // Fallback to config default if no warehouse found
        name: 'GreenWeave Store',
        phone: '0359994361',
        addressDetail: '19 ĐƯỜNG Định Bộ Lĩnh, P.Hải Cảng',
        province: 'Bình Định',
        district: 'TP.Qui Nhơn',
        ward: 'P.Hải Cảng',
        provinceId: 40,
        districtId: 464,
        wardId: 8541
      }

      console.log('📦 Calculating shipping from warehouse:', {
        using: defaultWarehouse ? 'database warehouse' : 'config fallback',
        fromAddress
      })

      const request: CalculateShippingFeeRequest = {
        provider: 'ViettelPost',
        fromAddress,
        toAddress: {
          name: formData.shippingAddress.fullName,
          phone: formData.shippingAddress.phone,
          addressDetail: formData.shippingAddress.addressLine,
          province: formData.shippingAddress.province,
          district: formData.shippingAddress.district,
          ward: formData.shippingAddress.ward,
          provinceId: Number(provinceId),
          districtId: Number(districtId)
        },
        weight: totalWeight,
        insuranceValue: calculateTotal(),
        codAmount: formData.paymentMethod === 'COD' ? calculateTotal() : 0
      }

      const response = await ShippingService.calculateShippingFees(request)
      setShippingOptions(response.options)
      
      // Auto-select the first available option
      if (response.options.length > 0) {
        const firstOption = response.options[0]
        setSelectedShippingOption(firstOption)
        setShippingFee(firstOption.fee)
      }
    } catch (err) {
      console.error('Error calculating shipping fee:', err)
      setError('Không thể tính phí vận chuyển')
    } finally {
      setLoadingShipping(false)
    }
  }

  // Address handlers
  const handleProvinceChange = async (provinceId: string) => {
    setLoadingAddress(true)
    try {
      const districtsData = await viettelPostAddressService.getDistricts(Number(provinceId))
      // Convert AddressDto[] to {label, value} format
      const districtsFormatted = districtsData.map(district => ({
        label: district.name,
        value: district.id.toString()
      }))
      setDistricts(districtsFormatted)
      setWards([])
      
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          province: provinces.find(p => p.value === provinceId)?.label || '',
          district: '',
          ward: ''
        }
      }))
    } catch (err) {
      console.error('Error loading districts:', err)
    } finally {
      setLoadingAddress(false)
    }
  }

  const handleDistrictChange = async (districtId: string) => {
    setLoadingAddress(true)
    try {
      const wardsData = await viettelPostAddressService.getWards(Number(districtId))
      // Convert AddressDto[] to {label, value} format
      const wardsFormatted = wardsData.map(ward => ({
        label: ward.name,
        value: ward.id.toString()
      }))
      setWards(wardsFormatted)
      
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          district: districts.find(d => d.value === districtId)?.label || '',
          ward: ''
        }
      }))
    } catch (err) {
      console.error('Error loading wards:', err)
    } finally {
      setLoadingAddress(false)
    }
  }

  const handleWardChange = (wardId: string) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        ward: wards.find(w => w.value === wardId)?.label || ''
      }
    }))
  }

  const handleShippingOptionChange = (option: ShippingOption) => {
    setSelectedShippingOption(option)
    setShippingFee(option.fee)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm')
      return
    }
    
    if (!formData.customerName || !formData.customerPhone) {
      setError('Vui lòng nhập đầy đủ thông tin khách hàng')
      return
    }
    
    if (!formData.shippingAddress.fullName || !formData.shippingAddress.phone || 
        !formData.shippingAddress.province || !formData.shippingAddress.district || 
        !formData.shippingAddress.ward || !formData.shippingAddress.addressLine) {
      setError('Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      const orderData: any = {
        items: formData.items,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod as any,
        note: formData.note,
        shippingFee: shippingFee,
        shippingProvider: 'ViettelPost',
        shippingServiceId: selectedShippingOption?.serviceId,
        customerInfo: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail || undefined
        }
      }
      
      const createdOrder = await OrderService.createOrderByAdmin(orderData)
      
      // Chuyển đến trang chi tiết đơn hàng
      navigate(`/admin/orders/${createdOrder.id}`)
      
    } catch (err: any) {
      console.error('Error creating order:', err)
      setError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo đơn hàng mới</h1>
              <p className="text-gray-600 mt-1">Tạo đơn hàng cho khách hàng</p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Info & Products */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách hàng *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn sản phẩm</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku} | Stock: {product.stock}</div>
                        <div className="text-sm font-semibold text-green-600">{product.price.toLocaleString()} VNĐ</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Thêm
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Items & Shipping */}
            <div className="space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đã chọn</h2>
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>Chưa có sản phẩm nào được chọn</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.unitPrice.toLocaleString()} VNĐ</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Tạm tính:</span>
                        <span>{calculateTotal().toLocaleString()} VNĐ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Phí vận chuyển:</span>
                        <span>{shippingFee.toLocaleString()} VNĐ</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                        <span>Tổng cộng:</span>
                        <span className="text-green-600">{calculateTotalWithShipping().toLocaleString()} VNĐ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên người nhận *</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.fullName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, fullName: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={formData.shippingAddress.phone}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, phone: e.target.value }
                      }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố *</label>
                      <select
                        value={provinces.find(p => p.label === formData.shippingAddress.province)?.value || ''}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        disabled={loadingAddress}
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map(province => (
                          <option key={province.value} value={province.value}>
                            {province.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện *</label>
                      <select
                        value={districts.find(d => d.label === formData.shippingAddress.district)?.value || ''}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        disabled={loadingAddress || districts.length === 0}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map(district => (
                          <option key={district.value} value={district.value}>
                            {district.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã *</label>
                      <select
                        value={wards.find(w => w.label === formData.shippingAddress.ward)?.value || ''}
                        onChange={(e) => handleWardChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        disabled={loadingAddress || wards.length === 0}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map(ward => (
                          <option key={ward.value} value={ward.value}>
                            {ward.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết *</label>
                    <textarea
                      value={formData.shippingAddress.addressLine}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, addressLine: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              {shippingOptions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức vận chuyển</h2>
                  <div className="space-y-3">
                    {shippingOptions.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                          selectedShippingOption?.serviceId === option.serviceId
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleShippingOptionChange(option)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {option.serviceName || 'Viettel Post'}
                            </div>
                            {option.estimatedDeliveryDays && (
                              <div className="text-sm text-gray-500">
                                Dự kiến: {option.estimatedDeliveryDays} ngày
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {option.fee.toLocaleString()} VNĐ
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {loadingShipping && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Đang tính phí vận chuyển...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === 'COD'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'COD' | 'BANK_TRANSFER' }))}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-sm text-gray-500">Khách hàng thanh toán khi nhận được hàng</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={formData.paymentMethod === 'BANK_TRANSFER'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'COD' | 'BANK_TRANSFER' }))}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Thanh toán chuyển khoản</div>
                      <div className="text-sm text-gray-500">Khách hàng chuyển khoản trước khi giao hàng</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú</h2>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  placeholder="Ghi chú thêm cho đơn hàng..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || formData.items.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tạo đơn hàng...
                </>
              ) : (
                'Tạo đơn hàng'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminCreateOrderPage
