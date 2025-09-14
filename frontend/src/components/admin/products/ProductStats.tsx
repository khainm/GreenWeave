import React from 'react'

interface ProductStatsProps {
  regular: number
  custom: number
  active: number
  inactive: number
}

const ProductStats: React.FC<ProductStatsProps> = ({ 
  regular, 
  custom, 
  active, 
  inactive 
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Danh sách hàng hóa</h1>
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Thường: {regular}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Tùy chỉnh: {custom}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Đang bán: {active}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          Ngừng bán: {inactive}
        </span>
      </div>
    </div>
  )
}

export default ProductStats