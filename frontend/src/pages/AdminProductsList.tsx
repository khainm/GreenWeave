import React, { useEffect, useState } from 'react'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { Product } from '../types/product'
import CustomProductModal from '../components/admin/CustomProductModal'
import { 
  ProductFilters, 
  ProductActions, 
  ProductTable,
  getProductType
} from '../components/admin/products'

// Extended type for sorting that includes productType
type SortableProductKey = keyof Product | 'productType'

const AdminProductsList: React.FC = () => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sortKey, setSortKey] = useState<SortableProductKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [productType, setProductType] = useState<'all' | 'regular' | 'custom'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { isCustomizable: boolean }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Customizable modal state (moved into component)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [editingCustomProduct, setEditingCustomProduct] = useState<Product | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])

  // Auto generate SKU when category changes in custom form
  // SKU auto-generate moved inside modal. Keep no-op effect to avoid refactoring other logic.

  // Fetch products from API
  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [prods, cats] = await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.list().catch(() => [])
      ])
      setProducts(prods)
      const meta: Record<string, { isCustomizable: boolean }> = {}
      cats.forEach(c => { meta[c.name] = { isCustomizable: c.isCustomizable } })
      setCategoryMeta(meta)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Refresh data when component becomes visible (e.g., when navigating back from add/edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Hàm xóa sản phẩm
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    
    try {
      await ProductService.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.')
    }
  }

  const filtered = products
    .filter(p => {
      const matchesStatus = status === 'all' || p.status === status
      const matchesSearch = p.name.toLowerCase().includes(debounced.toLowerCase()) || p.sku.toLowerCase().includes(debounced.toLowerCase())
      const matchesType = productType === 'all' || getProductType(p, categoryMeta) === productType
      return matchesStatus && matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortKey === 'productType') {
        const va = getProductType(a, categoryMeta)
        const vb = getProductType(b, categoryMeta)
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  // Handle sorting
  const handleSort = (key: SortableProductKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Handlers for Customizable modal
  const openCustomModal = () => setShowCustomModal(true)
  const closeCustomModal = () => {
    setShowCustomModal(false)
    setEditingCustomProduct(null)
  }
  
  const openCustomEditModal = (product: Product) => {
    setEditingCustomProduct(product)
    setShowCustomModal(true)
  }

  const handleCreated = (p: Product) => setProducts(prev => [p, ...prev])
  
  const handleUpdated = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
  }

  // Thống kê sản phẩm
  const productStats = {
    total: products.length,
    regular: products.filter(p => getProductType(p, categoryMeta) === 'regular').length,
    custom: products.filter(p => getProductType(p, categoryMeta) === 'custom').length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
              <p className="text-gray-600 mt-1">Quản lý và theo dõi tất cả sản phẩm trong hệ thống</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-green-600">{productStats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tạm dừng</p>
                  <p className="text-2xl font-bold text-orange-600">{productStats.inactive}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tùy chỉnh</p>
                  <p className="text-2xl font-bold text-purple-600">{productStats.custom}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <ProductFilters
                query={query}
                setQuery={setQuery}
                status={status}
                setStatus={setStatus}
                productType={productType}
                setProductType={setProductType}
              />
              <ProductActions onOpenCustomModal={openCustomModal} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Có lỗi xảy ra</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
            <p className="text-sm text-gray-600 mt-1">
              Hiển thị {filtered.length} sản phẩm
              {debounced && ` cho "${debounced}"`}
            </p>
          </div>
          
          <ProductTable
            products={filtered}
            isLoading={isLoading}
            categoryMeta={categoryMeta}
            getProductType={getProductType}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onDeleteProduct={handleDeleteProduct}
            onEditCustomProduct={openCustomEditModal}
          />
        </div>

        {/* Custom Product Modal */}
        {showCustomModal && (
          <CustomProductModal
            open={showCustomModal}
            onClose={closeCustomModal}
            onCreated={editingCustomProduct ? handleUpdated : handleCreated}
            initialProduct={editingCustomProduct || undefined}
          />
        )}
      </div>
    </div>
  )
}

export default AdminProductsList


