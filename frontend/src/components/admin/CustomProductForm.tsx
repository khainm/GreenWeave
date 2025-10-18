import React, { useState } from 'react'
// Removed: StickerManager import - use Sticker Library instead

export type CustomProductFormValues = {
  name: string
  sku: string
  category: string
  description: string
  // Removed: price, originalPrice, stock, weight, primaryWarehouseId
  // Custom products don't have these fields - they use consultation flow
  consultationNote?: string // Optional note for internal use (admin reference)
  colors: string[] // Required for custom products - at least 1 color
  selectedColor: string
  status: 'active' | 'inactive'
  images: string[]
  imageFiles: File[]
  hasChangedImages?: boolean
}

type CustomProductFormProps = {
  values: CustomProductFormValues
  setValues: React.Dispatch<React.SetStateAction<CustomProductFormValues>>
  isSubmitting?: boolean
  onSubmit: (e: React.FormEvent) => void
  enableSkuRegenerate?: boolean
  onRegenerateSku?: () => void
  categoryOptions?: { label: string; value: string; isCustomizable?: boolean }[]
  // Removed: warehouseOptions - custom products don't use warehouses
}

const popularColors = [
  { name: 'Xanh lá', value: '#10b981' },
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Đen', value: '#000000' },
  { name: 'Nâu', value: '#8b4513' },
  { name: 'Xám', value: '#6b7280' },
  { name: 'Xanh dương', value: '#3b82f6' },
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Vàng', value: '#f59e0b' },
  { name: 'Hồng', value: '#ec4899' },
  { name: 'Tím', value: '#8b5cf6' },
  { name: 'Cam', value: '#f97316' },
  { name: 'Xanh ngọc', value: '#06b6d4' }
]

const CustomProductForm: React.FC<CustomProductFormProps> = ({ 
  values, 
  setValues, 
  isSubmitting, 
  onSubmit, 
  enableSkuRegenerate, 
  onRegenerateSku, 
  categoryOptions
  // Removed: warehouseOptions - custom products don't use warehouses
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files).slice(0, 10)
    const newImageFiles = [...values.imageFiles, ...fileArray]
    const previews = await Promise.all(fileArray.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })))
    setValues(prev => ({ 
      ...prev, 
      images: [...prev.images, ...previews], 
      imageFiles: newImageFiles,
      hasChangedImages: true
    }))
  }

  const removeImageByIndex = (index: number) => {
    setValues(prev => {
      const removedImage = prev.images[index]
      const newImages = prev.images.filter((_, i) => i !== index)
      
      let newImageFiles = prev.imageFiles
      if (removedImage.startsWith('data:')) {
        const base64IndexBefore = prev.images
          .slice(0, index)
          .filter(img => img.startsWith('data:')).length
        
        newImageFiles = prev.imageFiles.filter((_, i) => i !== base64IndexBefore)
      }
      
      return { 
        ...prev, 
        images: newImages,
        imageFiles: newImageFiles,
        hasChangedImages: true
      }
    })
  }

  const makePrimaryImage = (index: number) => {
    setValues(prev => {
      if (index === 0) return prev
      const copy = [...prev.images]
      const [img] = copy.splice(index, 1)
      return { ...prev, images: [img, ...copy] }
    })
  }

  const addCustomColor = (color: string) => {
    if (!values.colors.includes(color)) {
      setValues(prev => ({ ...prev, colors: [...prev.colors, color] }))
    }
  }

  const updateColor = (index: number, newColor: string) => {
    const newColors = [...values.colors]
    const oldColor = newColors[index]
    newColors[index] = newColor
    setValues(prev => ({ 
      ...prev, 
      colors: newColors, 
      selectedColor: prev.selectedColor === oldColor ? newColor : prev.selectedColor 
    }))
  }

  const removeColor = (index: number) => {
    const newColors = values.colors.filter((_, i) => i !== index)
    const removedColor = values.colors[index]
    setValues(prev => ({ 
      ...prev, 
      colors: newColors,
      selectedColor: prev.selectedColor === removedColor ? (newColors[0] || '') : prev.selectedColor
    }))
  }

  // Validate form trước khi submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least 1 color is selected for custom products
    if (values.colors.length === 0) {
      alert('Sản phẩm tuỳ chỉnh phải có ít nhất 1 màu sắc!')
      return
    }
    
    onSubmit(e)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Tên sản phẩm & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => setValues(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Nhập tên sản phẩm tuỳ chỉnh"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mã SKU</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={values.sku}
              readOnly
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
            />
            {enableSkuRegenerate && (
              <button 
                type="button" 
                onClick={onRegenerateSku} 
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
              >
                Tạo lại
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh mục - CHỈ HIỂN THỊ DANH MỤC CUSTOM (isCustomizable = true) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục tuỳ chỉnh *</label>
        <div className="relative">
          <select
            value={values.category}
            onChange={(e) => setValues(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-2.5 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-28"
            required
          >
            <option value="">Chọn danh mục tuỳ chỉnh</option>
            {(categoryOptions ?? [])
              .filter(opt => opt.isCustomizable) // CHỈ LẤY DANH MỤC CUSTOM
              .map(opt => (
                <option key={opt.value} value={opt.label}>{opt.label}</option>
              ))}
          </select>
          <span className="absolute top-1/2 -translate-y-1/2 right-2 inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/>
            </svg>
            Tuỳ chỉnh
          </span>
        </div>
        <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
          💡 Danh mục này cho phép khách hàng tuỳ chỉnh màu sắc và thêm sticker
        </p>
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
        <textarea
          value={values.description}
          onChange={(e) => setValues(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Mô tả chi tiết về sản phẩm tuỳ chỉnh..."
        />
      </div>

      {/* Ghi chú tư vấn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ghi chú tư vấn
          <span className="text-gray-500 text-xs ml-2">(Tùy chọn)</span>
        </label>
        <textarea
          value={values.consultationNote || ''}
          onChange={(e) => setValues(prev => ({ ...prev, consultationNote: e.target.value }))}
          rows={3}
          maxLength={500}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Hướng dẫn khách hàng về cách đặt hàng, ví dụ: Liên hệ qua Facebook/Zalo để được tư vấn chi tiết..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {values.consultationNote?.length || 0}/500 ký tự
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sản phẩm custom không có giá cố định</p>
            <p className="text-blue-700">Khách hàng sẽ gửi yêu cầu tư vấn thay vì thêm vào giỏ hàng. Giá sẽ được trao đổi trực tiếp với khách hàng.</p>
          </div>
        </div>
      </div>

      {/* Hình ảnh sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Hình ảnh sản phẩm *</label>
        <div
          className={`border-2 ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} rounded-xl p-5 mb-4 text-center cursor-pointer`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('custom-image-input')?.click()}
        >
          <input 
            id="custom-image-input" 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={(e) => handleFiles(e.target.files)} 
          />
          <div className="text-gray-600 text-sm">
            Kéo thả ảnh vào đây hoặc <span className="text-indigo-600 font-semibold">chọn từ máy</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Hỗ trợ nhiều ảnh, tối đa ~10 ảnh</div>
        </div>

        {values.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {values.images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border ${idx === 0 ? 'border-indigo-500' : 'border-gray-200'}`}>
                <img src={img} alt={`product-${idx}`} className="w-full h-36 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 flex justify-between text-xs text-white">
                  <button 
                    type="button" 
                    onClick={() => makePrimaryImage(idx)} 
                    className={`px-2 py-1 rounded ${idx === 0 ? 'bg-indigo-600' : 'bg-black/40 hover:bg-black/60'}`}
                  >
                    {idx === 0 ? 'Ảnh chính' : 'Đặt làm chính'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeImageByIndex(idx)} 
                    className="px-2 py-1 bg-red-600 rounded hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Màu sắc sản phẩm - BẮT BUỘC cho sản phẩm custom */}
      <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50">
        <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-red-500">*</span>
          Màu sắc sản phẩm (Bắt buộc cho sản phẩm tuỳ chỉnh)
        </label>
        {values.colors.length === 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Vui lòng chọn ít nhất 1 màu sắc cho sản phẩm tuỳ chỉnh
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {values.colors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div 
                className="w-12 h-12 rounded-xl border-2 border-indigo-400 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(idx, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Click để thay đổi màu"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeColor(idx)
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                  title="Xóa màu này"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {popularColors.map((c) => {
            const isSelected = values.colors.includes(c.value)
            return (
              <button 
                key={c.value} 
                type="button" 
                onClick={() => addCustomColor(c.value)} 
                disabled={isSelected} 
                className={`w-10 h-10 rounded-lg border-2 transition-all ${isSelected ? 'border-indigo-500 opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400 hover:scale-105'}`} 
                style={{ backgroundColor: c.value }} 
                title={`${c.name}${isSelected ? ' (đã chọn)' : ''}`} 
              />
            )
          })}
        </div>
      </div>

      {/* Removed: Sticker Manager - Use Sticker Library instead */}

      {/* Trạng thái */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
        <select
          value={values.status}
          onChange={(e) => setValues(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>
      </div>

      {/* Submit button */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center shadow-lg"
        >
          {isSubmitting ? 'Đang lưu...' : '✨ Lưu sản phẩm tuỳ chỉnh'}
        </button>
      </div>
    </form>
  )
}

export default CustomProductForm
