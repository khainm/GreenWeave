import React, { useEffect, useState } from 'react'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { Product } from '../types/product'
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

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])

  // Auto generate SKU when category changes in custom form
  // SKU auto-generate moved inside modal. Keep no-op effect to avoid refactoring other logic.

  // Fetch products from API
  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 🚀 Force refresh sẽ bypass cache để lấy data mới nhất
      const [prods, cats] = await Promise.all([
        ProductService.getAllProducts(!forceRefresh), // useCache = !forceRefresh
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
    // 🚀 FORCE REFRESH khi component mount để đảm bảo data fresh
    fetchData(true)
  }, [])

  // Refresh data when component becomes visible (e.g., when navigating back from add/edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData(true) // Force refresh khi tab becomes visible
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Hàm xóa sản phẩm (confirm đã được xử lý ở ProductTableRow)
  const handleDeleteProduct = async (id: number) => {
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

  // Thống kê sản phẩm
  const productStats = {
    total: products.length,
    regular: products.filter(p => getProductType(p, categoryMeta) === 'regular').length,
    custom: products.filter(p => getProductType(p, categoryMeta) === 'custom').length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý sản phẩm
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                </svg>
                Quản lý và theo dõi tất cả sản phẩm trong hệ thống
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchData(true)} // Force refresh
                disabled={isLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* Stats Cards - Modern Gradient Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Products */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Tổng sản phẩm</p>
                  <p className="text-4xl font-bold text-white">{productStats.total}</p>
                  <p className="text-blue-200 text-xs mt-2">Tất cả loại</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Products */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Đang hoạt động</p>
                  <p className="text-4xl font-bold text-white">{productStats.active}</p>
                  <p className="text-green-200 text-xs mt-2">Có sẵn bán</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Inactive Products */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Tạm dừng</p>
                  <p className="text-4xl font-bold text-white">{productStats.inactive}</p>
                  <p className="text-orange-200 text-xs mt-2">Không bán</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom Products */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Tùy chỉnh</p>
                  <p className="text-4xl font-bold text-white">{productStats.custom}</p>
                  <p className="text-purple-200 text-xs mt-2">Có thể tuỳ biến</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions - Modern Glass Design */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800">Bộ lọc & Hành động</h3>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <ProductFilters
                query={query}
                setQuery={setQuery}
                status={status}
                setStatus={setStatus}
                productType={productType}
                setProductType={setProductType}
              />
              <ProductActions />
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

        {/* Products Table - Modern Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-indigo-50 to-purple-50">
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
          />
        </div>
      </div>
    </div>
  )
}

export default AdminProductsList


