import React, { useState, useEffect } from 'react'
import { ShippingService } from '../../services/shippingService'
import { ViettelPostAddressService } from '../../services/viettelPostAddressService'

interface ApiStatus {
  name: string
  status: 'loading' | 'success' | 'error'
  message: string
  data?: any
}

const ViettelPostApiStatus: React.FC = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkApiStatuses()
  }, [])

  const checkApiStatuses = async () => {
    setLoading(true)
    const statuses: ApiStatus[] = []

    // Check provinces API
    try {
      const provinces = await ViettelPostAddressService.getProvinces()
      statuses.push({
        name: 'Get Provinces',
        status: 'success',
        message: `✅ Lấy được ${provinces.length} tỉnh/thành phố`,
        data: provinces.length
      })
    } catch (error) {
      statuses.push({
        name: 'Get Provinces',
        status: 'error',
        message: '❌ Lỗi khi lấy danh sách tỉnh/thành phố'
      })
    }

    // Check districts API
    try {
      const districts = await ViettelPostAddressService.getDistricts(40) // Bình Định
      statuses.push({
        name: 'Get Districts',
        status: 'success',
        message: `✅ Lấy được ${districts.length} quận/huyện`,
        data: districts.length
      })
    } catch (error) {
      statuses.push({
        name: 'Get Districts',
        status: 'error',
        message: '❌ Lỗi khi lấy danh sách quận/huyện'
      })
    }

    // Check wards API
    try {
      const wards = await ViettelPostAddressService.getWards(464) // Quy Nhon
      statuses.push({
        name: 'Get Wards',
        status: 'success',
        message: `✅ Lấy được ${wards.length} phường/xã`,
        data: wards.length
      })
    } catch (error) {
      statuses.push({
        name: 'Get Wards',
        status: 'error',
        message: '❌ Lỗi khi lấy danh sách phường/xã'
      })
    }

    // Check inventory API
    try {
      const inventories = await ShippingService.listInventory()
      statuses.push({
        name: 'List Inventory',
        status: 'success',
        message: `✅ Lấy được ${inventories.length} kho hàng`,
        data: inventories.length
      })
    } catch (error) {
      statuses.push({
        name: 'List Inventory',
        status: 'error',
        message: '❌ Lỗi khi lấy danh sách kho hàng'
      })
    }

    setApiStatuses(statuses)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'loading':
        return '⏳'
      default:
        return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'loading':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang kiểm tra API...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Trạng thái API ViettelPost
        </h3>
        <button
          onClick={checkApiStatuses}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          🔄 Kiểm tra lại
        </button>
      </div>

      <div className="space-y-3">
        {apiStatuses.map((api, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(api.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">{getStatusIcon(api.status)}</span>
                <span className="font-medium">{api.name}</span>
              </div>
              {api.data && (
                <span className="text-sm font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                  {api.data} items
                </span>
              )}
            </div>
            <p className="text-sm mt-1">{api.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📋 APIs đã được cập nhật:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Get Provinces:</strong> Lấy danh sách tỉnh/thành phố</li>
          <li>• <strong>Get Province By ID:</strong> Lấy thông tin tỉnh theo ID</li>
          <li>• <strong>Get Districts:</strong> Lấy danh sách quận/huyện</li>
          <li>• <strong>Get Wards:</strong> Lấy danh sách phường/xã</li>
          <li>• <strong>List Inventory:</strong> Lấy danh sách kho hàng ViettelPost</li>
          <li>• <strong>Create Order:</strong> Tạo đơn hàng với ViettelPost</li>
          <li>• <strong>Update Order:</strong> Cập nhật đơn hàng</li>
          <li>• <strong>Calculate Fee:</strong> Tính phí vận chuyển</li>
        </ul>
      </div>
    </div>
  )
}

export default ViettelPostApiStatus
