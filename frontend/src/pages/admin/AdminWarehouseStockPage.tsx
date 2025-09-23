import React, { useState, useEffect } from 'react'
import TopNav from '../../components/admin/TopNav'
import productWarehouseStockService, { type ProductWarehouseStock } from '../../services/productWarehouseStockService'
import warehouseService from '../../services/warehouseService'
import type { Warehouse } from '../../types/warehouse'
import ProductService from '../../services/productService'
import type { Product } from '../../types/product'

const AdminWarehouseStockPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProductWarehouseStock[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStock, setEditingStock] = useState<ProductWarehouseStock | null>(null)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [stocksData, warehouseResponse, productsData] = await Promise.all([
        productWarehouseStockService.getAll(),
        warehouseService.getAllWarehouses(),
        ProductService.getAllProducts()
      ])
      
      const warehousesData = warehouseResponse.warehouses || []
      
      setStocks(stocksData)
      setWarehouses(warehousesData)
      setProducts(productsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    if (selectedWarehouse && stock.warehouseId !== selectedWarehouse) return false
    if (selectedProduct && stock.productId !== selectedProduct) return false
    return true
  })

  // Handle create stock
  const handleCreateStock = async (data: { productId: number; warehouseId: string; stock: number }) => {
    try {
      await productWarehouseStockService.create(data)
      await loadData()
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error creating stock:', err)
      alert('Có lỗi xảy ra khi tạo stock. Vui lòng thử lại.')
    }
  }

  // Handle update stock
  const handleUpdateStock = async (id: number, data: { stock: number; reservedStock: number }) => {
    try {
      await productWarehouseStockService.update(id, data)
      await loadData()
      setEditingStock(null)
    } catch (err) {
      console.error('Error updating stock:', err)
      alert('Có lỗi xảy ra khi cập nhật stock. Vui lòng thử lại.')
    }
  }

  // Handle delete stock
  const handleDeleteStock = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa stock này?')) return
    
    try {
      await productWarehouseStockService.delete(id)
      await loadData()
    } catch (err) {
      console.error('Error deleting stock:', err)
      alert('Có lỗi xảy ra khi xóa stock. Vui lòng thử lại.')
    }
  }

  if (isLoading) {
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Stock theo Kho</h1>
              <p className="text-gray-600 mt-1">Quản lý tồn kho sản phẩm theo từng kho</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm Stock
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo kho</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tất cả kho</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo sản phẩm</label>
              <select
                value={selectedProduct || ''}
                onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>
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

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm font-medium">
                  <th className="py-4 px-6">Sản phẩm</th>
                  <th className="py-4 px-6">Kho</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Reserved</th>
                  <th className="py-4 px-6">Available</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Không có dữ liệu stock
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map(stock => (
                    <tr key={stock.id} className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{stock.productName}</div>
                          <div className="text-sm text-gray-500">{stock.productSku}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {stock.warehouseName}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{stock.stock}</td>
                      <td className="py-4 px-6 text-orange-600">{stock.reservedStock}</td>
                      <td className="py-4 px-6 text-green-600 font-semibold">{stock.availableStock}</td>
                      <td className="py-4 px-6">
                        {stock.availableStock <= 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Hết hàng
                          </span>
                        ) : stock.availableStock <= 10 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Sắp hết
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Còn hàng
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingStock(stock)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStock(stock.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Stock Modal */}
        {showCreateModal && (
          <CreateStockModal
            warehouses={warehouses}
            products={products}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateStock}
          />
        )}

        {/* Edit Stock Modal */}
        {editingStock && (
          <EditStockModal
            stock={editingStock}
            onClose={() => setEditingStock(null)}
            onSubmit={(data) => handleUpdateStock(editingStock.id, data)}
          />
        )}
      </div>
    </div>
  )
}

// Create Stock Modal Component
interface CreateStockModalProps {
  warehouses: Warehouse[]
  products: Product[]
  onClose: () => void
  onSubmit: (data: { productId: number; warehouseId: string; stock: number }) => void
}

const CreateStockModal: React.FC<CreateStockModalProps> = ({ warehouses, products, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    stock: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productId || !formData.warehouseId) return
    
    onSubmit({
      productId: Number(formData.productId),
      warehouseId: formData.warehouseId,
      stock: formData.stock
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Thêm Stock</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12 10.59 13.4l-6.3 6.3 1.42 1.41L12 14.83l6.29 6.29 1.41-1.41-6.29-6.3 6.29-6.29z"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Chọn sản phẩm</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kho</label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Chọn kho</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Thêm Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Stock Modal Component
interface EditStockModalProps {
  stock: ProductWarehouseStock
  onClose: () => void
  onSubmit: (data: { stock: number; reservedStock: number }) => void
}

const EditStockModal: React.FC<EditStockModalProps> = ({ stock, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    stock: stock.stock,
    reservedStock: stock.reservedStock
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa Stock</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12 10.59 13.4l-6.3 6.3 1.42 1.41L12 14.83l6.29 6.29 1.41-1.41-6.29-6.3 6.29-6.29z"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Sản phẩm</div>
            <div className="font-semibold text-gray-900">{stock.productName}</div>
            <div className="text-sm text-gray-500">{stock.productSku}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Kho</div>
            <div className="font-semibold text-gray-900">{stock.warehouseName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tổng Stock</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reserved Stock</label>
            <input
              type="number"
              min="0"
              value={formData.reservedStock}
              onChange={(e) => setFormData(prev => ({ ...prev, reservedStock: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Available Stock</div>
            <div className="text-lg font-semibold text-blue-900">
              {formData.stock - formData.reservedStock}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminWarehouseStockPage
