import React, { useEffect, useMemo, useMemo as _, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'

type Product = {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  status: 'active' | 'inactive'
}

const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

const AdminProductsList: React.FC = () => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const products: Product[] = useMemo(() => [
    { id: 'P001', name: 'Túi Tote Non-stop Single', sku: 'NON1', category: 'Non-stop', stock: 120, price: 159000, status: 'active' },
    { id: 'P002', name: 'Túi Tote Non-stop Combo 2', sku: 'NON2', category: 'Non-stop', stock: 42, price: 299000, status: 'active' },
    { id: 'P003', name: 'Túi Tote Trơn Single', sku: 'TRON1', category: 'Trơn', stock: 200, price: 128000, status: 'inactive' },
    { id: 'P004', name: 'Túi Tote Thêu Cá Nhân Hóa', sku: 'THEU1', category: 'Thêu', stock: 35, price: 250000, status: 'active' }
  ], [])

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
                {filtered.map((p) => (
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
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Sửa
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProductsList


