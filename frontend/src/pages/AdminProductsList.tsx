import React, { useEffect, useState } from 'react'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { Product } from '../types/product'
import CustomProductModal from '../components/admin/CustomProductModal'
import { 
  ProductStats, 
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
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <ProductStats
              regular={productStats.regular}
              custom={productStats.custom}
              active={productStats.active}
              inactive={productStats.inactive}
            />
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              <ProductFilters
                query={query}
                setQuery={setQuery}
                status={status}
                setStatus={setStatus}
                productType={productType}
                setProductType={setProductType}
              />
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
              <ProductActions onOpenCustomModal={openCustomModal} />
            </div>
          </div>
        </div>

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


