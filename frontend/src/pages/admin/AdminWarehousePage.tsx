import React, { useState, useEffect } from 'react'
import TopNav from '../../components/admin/TopNav'
import WarehouseForm from '../../components/admin/WarehouseForm'
import WarehouseTable from '../../components/admin/WarehouseTable'
import warehouseService from '../../services/warehouseService'
import type { 
  Warehouse, 
  CreateWarehouseRequest, 
  UpdateWarehouseRequest,
  WarehouseResponse,
  RegisterWarehouseResult 
} from '../../types/warehouse'

const AdminWarehousePage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true)
      const response: WarehouseResponse = await warehouseService.getAllWarehouses()
      if (response.success && response.warehouses) {
        setWarehouses(response.warehouses)
      } else {
        showMessage('error', response.message || 'Không thể tải danh sách kho hàng')
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      showMessage('error', 'Lỗi khi tải danh sách kho hàng')
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleCreateWarehouse = async (data: CreateWarehouseRequest) => {
    try {
      setIsSubmitting(true)
      const response: WarehouseResponse = await warehouseService.createWarehouse(data)
      
      if (response.success) {
        showMessage('success', 'Tạo kho hàng thành công!')
        setShowForm(false)
        fetchWarehouses()
      } else {
        showMessage('error', response.message || 'Tạo kho hàng thất bại')
      }
    } catch (error) {
      console.error('Error creating warehouse:', error)
      showMessage('error', 'Lỗi khi tạo kho hàng')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateWarehouse = async (data: UpdateWarehouseRequest) => {
    if (!editingWarehouse) return

    try {
      setIsSubmitting(true)
      const response: WarehouseResponse = await warehouseService.updateWarehouse(editingWarehouse.id, data)
      
      if (response.success) {
        showMessage('success', 'Cập nhật kho hàng thành công!')
        setShowForm(false)
        setEditingWarehouse(undefined)
        fetchWarehouses()
      } else {
        showMessage('error', response.message || 'Cập nhật kho hàng thất bại')
      }
    } catch (error) {
      console.error('Error updating warehouse:', error)
      showMessage('error', 'Lỗi khi cập nhật kho hàng')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setShowForm(true)
  }

  const handleDeleteWarehouse = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) {
      return
    }

    try {
      const response: WarehouseResponse = await warehouseService.deleteWarehouse(id)
      
      if (response.success) {
        showMessage('success', 'Xóa kho hàng thành công!')
        fetchWarehouses()
      } else {
        showMessage('error', response.message || 'Xóa kho hàng thất bại')
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      showMessage('error', 'Lỗi khi xóa kho hàng')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response: WarehouseResponse = await warehouseService.setAsDefault(id)
      
      if (response.success) {
        showMessage('success', 'Đặt kho mặc định thành công!')
        fetchWarehouses()
      } else {
        showMessage('error', response.message || 'Đặt kho mặc định thất bại')
      }
    } catch (error) {
      console.error('Error setting default warehouse:', error)
      showMessage('error', 'Lỗi khi đặt kho mặc định')
    }
  }

  const handleRegisterWithViettelPost = async (id: string) => {
    try {
      const response: RegisterWarehouseResult = await warehouseService.registerWithViettelPost(id)
      
      if (response.isSuccess) {
        showMessage('success', `Đăng ký với ViettelPost thành công! GroupAddress ID: ${response.groupAddressId}`)
        fetchWarehouses()
      } else {
        showMessage('error', response.errorMessage || 'Đăng ký với ViettelPost thất bại')
      }
    } catch (error) {
      console.error('Error registering with ViettelPost:', error)
      showMessage('error', 'Lỗi khi đăng ký với ViettelPost')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingWarehouse(undefined)
  }

  const handleSubmitForm = async (data: CreateWarehouseRequest | UpdateWarehouseRequest) => {
    if (editingWarehouse) {
      await handleUpdateWarehouse(data as UpdateWarehouseRequest)
    } else {
      await handleCreateWarehouse(data as CreateWarehouseRequest)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý kho hàng</h1>
              <p className="mt-2 text-gray-600">
                Quản lý các kho hàng và đăng ký với ViettelPost
              </p>
            </div>
            
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm kho hàng
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {showForm ? (
          <WarehouseForm
            warehouse={editingWarehouse}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        ) : (
          <WarehouseTable
            warehouses={warehouses}
            onEdit={handleEditWarehouse}
            onDelete={handleDeleteWarehouse}
            onSetDefault={handleSetDefault}
            onRegister={handleRegisterWithViettelPost}
            loading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

export default AdminWarehousePage
