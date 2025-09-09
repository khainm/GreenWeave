import React from 'react'

interface DesignToolsProps {
  onAddText: () => void
  onAddDesign: () => void
  onSave: () => void
  onOrder: () => void
  basePrice: number
  isSaving?: boolean
}

const DesignTools: React.FC<DesignToolsProps> = ({
  onAddText,
  onAddDesign,
  onSave,
  onOrder,
  basePrice,
  isSaving = false
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Công cụ thiết kế</h3>
      
      <div className="space-y-4">
        {/* Design Tools */}
        <div className="space-y-3">
          <button
            onClick={onAddText}
            className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3"
          >
            <span className="font-bold text-lg">Tt</span>
            <span>Thêm chữ</span>
          </button>
          <button
            onClick={onAddDesign}
            className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3"
          >
            <span className="text-lg">📁</span>
            <span>Thêm thiết kế của bạn</span>
          </button>
        </div>
        
        {/* Price */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Giá sản phẩm</div>
          <div className="text-2xl font-bold text-green-600">
            {basePrice.toLocaleString('vi-VN')} ₫
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">⭐</span>
            <span>Lưu thiết kế</span>
          </button>
          
          <button
            onClick={onOrder}
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>🛒</span>
                <span>Đặt hàng</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DesignTools
