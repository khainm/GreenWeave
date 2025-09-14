import React from 'react'
import { Link } from 'react-router-dom'

interface ProductActionsProps {
  onOpenCustomModal: () => void
}

const ProductActions: React.FC<ProductActionsProps> = ({ onOpenCustomModal }) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <Link 
        to="/admin/products/add" 
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center"
      >
        <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Thêm hàng hóa
      </Link>
      <button
        type="button"
        onClick={onOpenCustomModal}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center"
      >
        <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
        </svg>
        Thêm hàng hóa tùy chỉnh
      </button>
    </div>
  )
}

export default ProductActions