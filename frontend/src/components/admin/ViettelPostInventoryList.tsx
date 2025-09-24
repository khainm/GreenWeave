import React, { useState, useEffect } from 'react'
import { ShippingService } from '../../services/shippingService'
import type { InventoryData } from '../../types/shipping'

interface ViettelPostInventoryListProps {
  onInventorySelect?: (inventory: InventoryData) => void
}

const ViettelPostInventoryList: React.FC<ViettelPostInventoryListProps> = ({
  onInventorySelect
}) => {
  const [inventories, setInventories] = useState<InventoryData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInventories()
  }, [])

  const loadInventories = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 [ViettelPostInventoryList] Loading inventories...')
      const data = await ShippingService.listInventory()
      console.log('✅ [ViettelPostInventoryList] Loaded inventories:', data)
      setInventories(data || [])
    } catch (error) {
      console.error('❌ [ViettelPostInventoryList] Error loading inventories:', error)
      setError('Không thể tải danh sách kho hàng từ ViettelPost')
    } finally {
      setLoading(false)
    }
  }

  const handleInventoryClick = (inventory: InventoryData) => {
    if (onInventorySelect) {
      onInventorySelect(inventory)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải danh sách kho hàng...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadInventories}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (inventories.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-gray-500 mb-2">📦</div>
          <h3 className="text-gray-700 font-medium">Không có kho hàng</h3>
          <p className="text-gray-500 text-sm mt-1">
            Chưa có kho hàng nào được đăng ký với ViettelPost
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Danh sách kho hàng ViettelPost ({inventories.length})
        </h3>
        <button
          onClick={loadInventories}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          🔄 Làm mới
        </button>
      </div>

      <div className="grid gap-3">
        {inventories.map((inventory) => (
          <div
            key={inventory.groupAddressId}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleInventoryClick(inventory)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{inventory.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  📞 {inventory.phone}
                </p>
                <p className="text-sm text-gray-600">
                  📍 {inventory.address}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>ID: {inventory.groupAddressId}</span>
                  <span>Customer ID: {inventory.cusId}</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Province: {inventory.provinceId}</div>
                <div>District: {inventory.districtId}</div>
                <div>Ward: {inventory.wardsId}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ViettelPostInventoryList
