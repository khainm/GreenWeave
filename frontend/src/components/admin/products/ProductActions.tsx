import React from 'react'
import { Link } from 'react-router-dom'

const ProductActions: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Add Regular Product */}
      <Link 
        to="/admin/products/add-regular" 
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        📦 Thêm sản phẩm thường
      </Link>
      
      {/* Add Custom Product */}
      <Link
        to="/admin/products/add-custom"
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/>
        </svg>
        ⚙️ Thêm sản phẩm tùy chỉnh
      </Link>
    </div>
  )
}

export default ProductActions