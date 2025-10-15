import React, { useState } from 'react'
import { ShippingService } from '../../services/shippingService'
import { ViettelPostAddressService } from '../../services/viettelPostAddressService'

interface RegisterInventoryFormProps {
  onRegistrationSuccess?: (result: { groupAddressId: number; message: string }) => void
  onCancel?: () => void
}

const RegisterInventoryForm: React.FC<RegisterInventoryFormProps> = ({
  onRegistrationSuccess,
  onCancel
}) => {
  // Form data
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    address: '',
    provinceId: 0,
    districtId: 0,
    wardsId: 0
  })

  // Address data
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load provinces on mount
  React.useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    try {
      setLoadingAddress(true)
      const data = await ViettelPostAddressService.getProvinces()
      setProvinces(data)
    } catch (error) {
      console.error('Error loading provinces:', error)
      setError('Không thể tải danh sách tỉnh/thành phố')
    } finally {
      setLoadingAddress(false)
    }
  }

  const handleProvinceChange = async (provinceId: number) => {
    setFormData(prev => ({ ...prev, provinceId, districtId: 0, wardsId: 0 }))
    setDistricts([])
    setWards([])

    if (provinceId > 0) {
      try {
        setLoadingAddress(true)
        const data = await ViettelPostAddressService.getDistricts(provinceId)
        setDistricts(data)
      } catch (error) {
        console.error('Error loading districts:', error)
        setError('Không thể tải danh sách quận/huyện')
      } finally {
        setLoadingAddress(false)
      }
    }
  }

  const handleDistrictChange = async (districtId: number) => {
    setFormData(prev => ({ ...prev, districtId, wardsId: 0 }))
    setWards([])

    if (districtId > 0) {
      try {
        setLoadingAddress(true)
        const data = await ViettelPostAddressService.getWards(districtId)
        setWards(data)
      } catch (error) {
        console.error('Error loading wards:', error)
        setError('Không thể tải danh sách xã/phường')
      } finally {
        setLoadingAddress(false)
      }
    }
  }

  const validateForm = (): string | null => {
    if (!formData.phone.trim()) {
      return 'Số điện thoại không được để trống'
    }
    
    // Vietnamese phone number validation
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      return 'Số điện thoại không hợp lệ (VD: 0901234567)'
    }

    if (!formData.name.trim()) {
      return 'Tên không được để trống'
    }

    if (!formData.address.trim()) {
      return 'Địa chỉ không được để trống'
    }

    if (formData.provinceId <= 0) {
      return 'Vui lòng chọn tỉnh/thành phố'
    }

    if (formData.districtId <= 0) {
      return 'Vui lòng chọn quận/huyện'
    }

    if (formData.wardsId <= 0) {
      return 'Vui lòng chọn xã/phường'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const result = await ShippingService.registerInventory({
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        address: formData.address.trim(),
        wardsId: formData.wardsId
      })

      if (result.success && result.groupAddressId) {
        setSuccess(`Đăng ký kho hàng thành công! ID: ${result.groupAddressId}`)
        onRegistrationSuccess?.(result as any)
        
        // Reset form
        setFormData({
          phone: '',
          name: '',
          address: '',
          provinceId: 0,
          districtId: 0,
          wardsId: 0
        })
        setDistricts([])
        setWards([])
      } else {
        setError(result.error || 'Đăng ký kho hàng thất bại')
      }
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi đăng ký kho hàng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🏪 Đăng ký kho hàng mới
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-sm">⚠️ {error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-600 text-sm">✅ {success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="0901234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên kho hàng *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="VD: Kho hàng Cầu Giấy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ chi tiết *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="VD: 61 K2 Cầu Diễn"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố *
          </label>
          <select
            value={formData.provinceId}
            onChange={(e) => handleProvinceChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || loadingAddress}
          >
            <option value={0}>Chọn tỉnh/thành phố...</option>
            {provinces.map((province) => (
              <option key={province.provinceId} value={province.provinceId}>
                {province.provinceName}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quận/Huyện *
          </label>
          <select
            value={formData.districtId}
            onChange={(e) => handleDistrictChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || loadingAddress || formData.provinceId === 0}
          >
            <option value={0}>Chọn quận/huyện...</option>
            {districts.map((district) => (
              <option key={district.districtId} value={district.districtId}>
                {district.districtName}
              </option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Xã/Phường *
          </label>
          <select
            value={formData.wardsId}
            onChange={(e) => setFormData(prev => ({ ...prev, wardsId: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading || loadingAddress || formData.districtId === 0}
          >
            <option value={0}>Chọn xã/phường...</option>
            {wards.map((ward) => (
              <option key={ward.wardsId} value={ward.wardsId}>
                {ward.wardsName}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || loadingAddress}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang đăng ký...
              </div>
            ) : (
              '📦 Đăng ký kho hàng'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Lưu ý:</strong> Thông tin đăng ký phải chính xác để ViettelPost có thể liên hệ và lấy hàng.</p>
      </div>
    </div>
  )
}

export default RegisterInventoryForm