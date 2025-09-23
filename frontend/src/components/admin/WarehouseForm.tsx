import React, { useState, useEffect } from 'react'
import type { Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest } from '../../types/warehouse'
import ViettelPostAddressService from '../../services/viettelPostAddressService'

interface WarehouseFormProps {
  warehouse?: Warehouse
  onSubmit: (data: CreateWarehouseRequest | UpdateWarehouseRequest) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

interface AddressOption {
  id: number
  name: string
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({
  warehouse,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressDetail: '',
    provinceId: 0,
    districtId: 0,
    wardId: 0,
    provinceName: '',
    districtName: '',
    wardName: '',
    isDefault: false,
    notes: ''
  })

  const [provinces, setProvinces] = useState<AddressOption[]>([])
  const [districts, setDistricts] = useState<AddressOption[]>([])
  const [wards, setWards] = useState<AddressOption[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        phone: warehouse.phone,
        addressDetail: warehouse.addressDetail,
        provinceId: warehouse.provinceId,
        districtId: warehouse.districtId,
        wardId: warehouse.wardId,
        provinceName: warehouse.provinceName,
        districtName: warehouse.districtName,
        wardName: warehouse.wardName,
        isDefault: warehouse.isDefault,
        notes: warehouse.notes || ''
      })
    }
    loadProvinces()
  }, [warehouse])

  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const response = await ViettelPostAddressService.getProvinces()
      console.log('🔍 [WarehouseForm] Loaded provinces:', response)
      setProvinces(response || [])
    } catch (error) {
      console.error('Error loading provinces:', error)
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    if (!provinceId) return
    
    setLoadingDistricts(true)
    setDistricts([])
    setWards([])
    setFormData(prev => ({ ...prev, districtId: 0, wardId: 0, districtName: '', wardName: '' }))
    
    try {
      const response = await ViettelPostAddressService.getDistricts(provinceId)
      console.log('🔍 [WarehouseForm] Loaded districts:', response)
      setDistricts(response || [])
    } catch (error) {
      console.error('Error loading districts:', error)
    } finally {
      setLoadingDistricts(false)
    }
  }

  const loadWards = async (districtId: number) => {
    if (!districtId) return
    
    setLoadingWards(true)
    setWards([])
    setFormData(prev => ({ ...prev, wardId: 0, wardName: '' }))
    
    try {
      const response = await ViettelPostAddressService.getWards(districtId)
      console.log('🔍 [WarehouseForm] Loaded wards:', response)
      setWards(response || [])
    } catch (error) {
      console.error('Error loading wards:', error)
    } finally {
      setLoadingWards(false)
    }
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = parseInt(e.target.value)
    const provinceName = e.target.selectedOptions[0]?.text || ''
    
    setFormData(prev => ({ 
      ...prev, 
      provinceId, 
      provinceName,
      districtId: 0,
      wardId: 0,
      districtName: '',
      wardName: ''
    }))
    
    loadDistricts(provinceId)
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value)
    const districtName = e.target.selectedOptions[0]?.text || ''
    
    setFormData(prev => ({ 
      ...prev, 
      districtId, 
      districtName,
      wardId: 0,
      wardName: ''
    }))
    
    loadWards(districtId)
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = parseInt(e.target.value)
    const wardName = e.target.selectedOptions[0]?.text || ''
    
    setFormData(prev => ({ 
      ...prev, 
      wardId, 
      wardName
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {warehouse ? 'Chỉnh sửa kho hàng' : 'Thêm kho hàng mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tên kho */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Tên kho hàng *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nhập tên kho hàng"
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nhập số điện thoại"
          />
        </div>

        {/* Địa chỉ chi tiết */}
        <div>
          <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ chi tiết *
          </label>
          <input
            type="text"
            id="addressDetail"
            name="addressDetail"
            value={formData.addressDetail}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Số nhà, tên đường, tòa nhà..."
          />
        </div>

        {/* Tỉnh/Thành phố */}
        <div>
          <label htmlFor="provinceId" className="block text-sm font-medium text-gray-700 mb-2">
            Tỉnh/Thành phố *
          </label>
          <select
            id="provinceId"
            value={formData.provinceId}
            onChange={handleProvinceChange}
            required
            disabled={loadingProvinces}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={0}>
              {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
            </option>
            {provinces.map(province => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quận/Huyện */}
        <div>
          <label htmlFor="districtId" className="block text-sm font-medium text-gray-700 mb-2">
            Quận/Huyện *
          </label>
          <select
            id="districtId"
            value={formData.districtId}
            onChange={handleDistrictChange}
            required
            disabled={loadingDistricts || !formData.provinceId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={0}>
              {loadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'}
            </option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Phường/Xã */}
        <div>
          <label htmlFor="wardId" className="block text-sm font-medium text-gray-700 mb-2">
            Phường/Xã *
          </label>
          <select
            id="wardId"
            value={formData.wardId}
            onChange={handleWardChange}
            required
            disabled={loadingWards || !formData.districtId}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={0}>
              {loadingWards ? 'Đang tải...' : 'Chọn phường/xã'}
            </option>
            {wards.map(ward => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Kho mặc định */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
            Đặt làm kho mặc định
          </label>
        </div>

        {/* Ghi chú */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nhập ghi chú (tùy chọn)"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {warehouse ? 'Cập nhật' : 'Tạo kho hàng'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default WarehouseForm
