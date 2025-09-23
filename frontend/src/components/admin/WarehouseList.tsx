import React from 'react'
import type { Warehouse } from '../../types/warehouse'

interface WarehouseListProps {
  warehouses: Warehouse[]
  onEdit: (warehouse: Warehouse) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  onRegister: (id: string) => void
  isLoading: boolean
}

const WarehouseList: React.FC<WarehouseListProps> = ({
  warehouses,
  onEdit,
  onDelete,
  onSetDefault,
  onRegister,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có kho hàng nào</h3>
        <p className="text-gray-500">Hãy thêm kho hàng đầu tiên để bắt đầu quản lý.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {warehouses.map((warehouse) => (
          <li key={warehouse.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {warehouse.name}
                      </h3>
                      {warehouse.isDefault && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Mặc định
                        </span>
                      )}
                      {warehouse.isRegistered && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Đã đăng ký
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-500">
                      <p className="truncate">
                        📍 {warehouse.addressDetail}, {warehouse.wardName}, {warehouse.districtName}, {warehouse.provinceName}
                      </p>
                      <p className="truncate">
                        📞 {warehouse.phone}
                      </p>
                      {warehouse.groupAddressId && (
                        <p className="truncate">
                          🏢 GroupAddress ID: {warehouse.groupAddressId}
                        </p>
                      )}
                      {warehouse.notes && (
                        <p className="truncate text-gray-400">
                          📝 {warehouse.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!warehouse.isDefault && (
                  <button
                    onClick={() => onSetDefault(warehouse.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Đặt mặc định
                  </button>
                )}
                
                {!warehouse.isRegistered && (
                  <button
                    onClick={() => onRegister(warehouse.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Đăng ký ViettelPost
                  </button>
                )}
                
                <button
                  onClick={() => onEdit(warehouse)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Chỉnh sửa
                </button>
                
                <button
                  onClick={() => onDelete(warehouse.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Xóa
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default WarehouseList
