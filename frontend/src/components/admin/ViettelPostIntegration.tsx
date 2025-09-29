import React, { useState } from 'react'
import TopNav from './TopNav'
import ViettelPostApiStatus from './ViettelPostApiStatus'
import ViettelPostInventoryList from './ViettelPostInventoryList'
import ViettelPostWebhookStatus from './ViettelPostWebhookStatus'
import type { InventoryData } from '../../types/shipping'

const ViettelPostIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'inventory' | 'webhook'>('status')
  const [selectedInventory, setSelectedInventory] = useState<InventoryData | null>(null)

  const handleInventorySelect = (inventory: InventoryData) => {
    setSelectedInventory(inventory)
    console.log('Selected inventory:', inventory)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Tích hợp ViettelPost
                </h2>
                <p className="text-gray-600 mt-1">
                  Quản lý và theo dõi các API ViettelPost
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Đang hoạt động</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'status'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Trạng thái API
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'inventory'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📦 Kho hàng ViettelPost
                </button>
                <button
                  onClick={() => setActiveTab('webhook')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'webhook'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🔗 Webhook
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'status' && (
                <div className="space-y-4">
                  <ViettelPostApiStatus />
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  {selectedInventory && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-blue-900 mb-2">
                        Kho hàng đã chọn
                      </h3>
                      <div className="text-sm text-blue-800">
                        <p><strong>Tên:</strong> {selectedInventory.name}</p>
                        <p><strong>Điện thoại:</strong> {selectedInventory.phone}</p>
                        <p><strong>Địa chỉ:</strong> {selectedInventory.address}</p>
                        <p><strong>ID:</strong> {selectedInventory.groupAddressId}</p>
                      </div>
                      <button
                        onClick={() => setSelectedInventory(null)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}
                  
                  <ViettelPostInventoryList onInventorySelect={handleInventorySelect} />
                </div>
              )}

              {activeTab === 'webhook' && (
                <div className="space-y-4">
                  <ViettelPostWebhookStatus />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thao tác nhanh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('status')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-medium text-gray-900">Kiểm tra API</h4>
                  <p className="text-sm text-gray-600">Xem trạng thái các API</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('inventory')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <h4 className="font-medium text-gray-900">Kho hàng</h4>
                  <p className="text-sm text-gray-600">Xem danh sách kho hàng</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('webhook')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔗</div>
                  <h4 className="font-medium text-gray-900">Webhook</h4>
                  <p className="text-sm text-gray-600">Theo dõi webhook</p>
                </div>
              </button>
              
              <button
                onClick={() => window.open('https://partner.viettelpost.vn', '_blank')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🌐</div>
                  <h4 className="font-medium text-gray-900">ViettelPost Portal</h4>
                  <p className="text-sm text-gray-600">Mở trang quản lý</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViettelPostIntegration