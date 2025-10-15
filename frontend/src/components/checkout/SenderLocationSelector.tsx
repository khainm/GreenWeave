import React, { useState, useEffect } from 'react'
import { ShippingService } from '../../services/shippingService'
import type { InventoryData } from '../../types/shipping'

interface SenderLocationSelectorProps {
  selectedLocation?: InventoryData | null
  onLocationSelect: (location: InventoryData | null) => void
  className?: string
}

const SenderLocationSelector: React.FC<SenderLocationSelectorProps> = ({
  selectedLocation,
  onLocationSelect,
  className = ''
}) => {
  const [inventories, setInventories] = useState<InventoryData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadInventories()
  }, [])

  const loadInventories = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔍 [SenderLocationSelector] Loading sender locations...')
      const data = await ShippingService.listInventory()
      console.log('✅ [SenderLocationSelector] Loaded locations:', data)
      setInventories(data || [])
    } catch (error) {
      console.error('❌ [SenderLocationSelector] Error loading locations:', error)
      setError('Không thể tải danh sách địa điểm gửi hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationClick = (inventory: InventoryData) => {
    onLocationSelect(inventory)
    setShowDropdown(false)
  }

  const handleClearSelection = () => {
    onLocationSelect(null)
    setShowDropdown(false)
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Điểm gửi hàng 📦
      </label>
      
      {/* Selected Location Display */}
      <div 
        className="w-full border border-gray-300 rounded-lg p-3 cursor-pointer bg-white hover:border-blue-500 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {selectedLocation ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{selectedLocation.name}</div>
              <div className="text-sm text-gray-600">📍 {selectedLocation.address}</div>
              <div className="text-xs text-gray-500">📞 {selectedLocation.phone}</div>
            </div>
            <div className="text-blue-600">
              {showDropdown ? '▲' : '▼'}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-500">
            <span>Chọn địa điểm gửi hàng...</span>
            <div className="text-gray-400">
              {showDropdown ? '▲' : '▼'}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={loadInventories}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && inventories.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Không có địa điểm gửi hàng nào
            </div>
          )}

          {!loading && !error && inventories.length > 0 && (
            <>
              {/* Clear selection option */}
              {selectedLocation && (
                <div
                  className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-gray-100"
                  onClick={handleClearSelection}
                >
                  <div className="text-red-600 text-sm font-medium">
                    ❌ Bỏ chọn
                  </div>
                </div>
              )}

              {/* Location options */}
              {inventories.map((inventory) => (
                <div
                  key={inventory.groupAddressId}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    selectedLocation?.groupAddressId === inventory.groupAddressId
                      ? 'bg-blue-50 border-blue-200'
                      : ''
                  }`}
                  onClick={() => handleLocationClick(inventory)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {inventory.name}
                        {selectedLocation?.groupAddressId === inventory.groupAddressId && (
                          <span className="ml-2 text-blue-600">✓</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {inventory.address}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        📞 {inventory.phone}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      <div>ID: {inventory.groupAddressId}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default SenderLocationSelector