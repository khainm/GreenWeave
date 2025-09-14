import React from 'react'

interface ProductFiltersProps {
  query: string
  setQuery: (value: string) => void
  status: 'all' | 'active' | 'inactive'
  setStatus: (value: 'all' | 'active' | 'inactive') => void
  productType: 'all' | 'regular' | 'custom'
  setProductType: (value: 'all' | 'regular' | 'custom') => void
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  query,
  setQuery,
  status,
  setStatus,
  productType,
  setProductType
}) => {
  return (
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
      <select 
        value={productType} 
        onChange={(e) => setProductType(e.target.value as any)} 
        className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors min-w-[160px]"
      >
        <option value="all">Tất cả loại</option>
        <option value="regular">Sản phẩm thường</option>
        <option value="custom">Sản phẩm tùy chỉnh</option>
      </select>
    </div>
  )
}

export default ProductFilters