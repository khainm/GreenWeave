import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import type { Product } from '../types/product'

const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

const AdminProductsList: React.FC = () => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await ProductService.getAllProducts()
        setProducts(data)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
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
    .filter(p =>
      (status === 'all' || p.status === status) &&
      (p.name.toLowerCase().includes(debounced.toLowerCase()) || p.sku.toLowerCase().includes(debounced.toLowerCase()))
    )
    .sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Danh sách hàng hóa</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Tìm theo tên hoặc SKU" 
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
                />
                <svg className="absolute left-3 top-3" width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M21 20l-5.2-5.2a7 7 0 10-1.4 1.4L20 21l1-1zM5 10a5 5 0 1110 0A5 5 0 015 10z"/>
                </svg>
              </div>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)} 
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors min-w-[160px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
              <Link 
                to="/admin/products/add" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Thêm hàng hóa
              </Link>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm font-medium">
                  {[
                    { key: 'sku', label: 'Mã' },
                    { key: 'name', label: 'Tên hàng hóa' },
                    { key: 'category', label: 'Danh mục' },
                    { key: 'stock', label: 'Tồn kho' },
                    { key: 'price', label: 'Giá bán' },
                  ].map((c) => (
                    <th 
                      key={c.key} 
                      className="py-4 px-6 cursor-pointer select-none hover:bg-gray-100 transition-colors" 
                      onClick={() => {
                        const k = c.key as keyof Product
                        if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                        else { setSortKey(k); setSortDir('asc') }
                      }}
                    >
                      <div className="flex items-center">
                        <span>{c.label}</span>
                        {sortKey === (c.key as keyof Product) && (
                          <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z" transform={sortDir === 'asc' ? 'rotate(180 12 12)' : ''} />
                          </svg>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500">Đang tải danh sách sản phẩm...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm nào'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-700 font-medium">{p.sku}</td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-4 px-6 text-gray-600">{p.category}</td>
                      <td className="py-4 px-6 text-gray-700">{p.stock}</td>
                      <td className="py-4 px-6 text-gray-900 font-bold">{formatVnd(p.price)} đ</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/admin/products/edit/${p.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Sửa
                          </Link>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Xóa
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
      </div>
    </div>
  )
}

export default AdminProductsList


