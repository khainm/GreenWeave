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
      {/* Search Input with Icon */}
      <div className="relative">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="🔍 Tìm theo tên hoặc SKU" 
          className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
        />
        <svg className="absolute left-3 top-3.5 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {/* Status Filter */}
      <select 
        value={status} 
        onChange={(e) => setStatus(e.target.value as any)} 
        className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[160px] bg-white font-medium"
      >
        <option value="all">📊 Tất cả trạng thái</option>
        <option value="active">✅ Đang bán</option>
        <option value="inactive">⏸️ Ngừng bán</option>
      </select>
      
      {/* Product Type Filter */}
      <select 
        value={productType} 
        onChange={(e) => setProductType(e.target.value as any)} 
        className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 min-w-[160px] bg-white font-medium"
      >
        <option value="all">🏷️ Tất cả loại</option>
        <option value="regular">📦 Sản phẩm thường</option>
        <option value="custom">⚙️ Sản phẩm tùy chỉnh</option>
      </select>
    </div>
  )
}

export default ProductFilters