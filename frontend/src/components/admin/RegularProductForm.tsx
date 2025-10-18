import React, { useState } from 'react'

export type RegularProductFormValues = {
  name: string
  sku: string
  category: string
  description: string
  price: number
  originalPrice: number
  stock: number
  weight: number
  colors: string[]
  selectedColor: string
  status: 'active' | 'inactive'
  primaryWarehouseId?: string
  images: string[]
  imageFiles: File[]
  hasChangedImages?: boolean
}

type RegularProductFormProps = {
  values: RegularProductFormValues
  setValues: React.Dispatch<React.SetStateAction<RegularProductFormValues>>
  isSubmitting?: boolean
  onSubmit: (e: React.FormEvent) => void
  enableSkuRegenerate?: boolean
  onRegenerateSku?: () => void
  categoryOptions?: { label: string; value: string; isCustomizable?: boolean }[]
  warehouseOptions?: { label: string; value: string }[]
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

const RegularProductForm: React.FC<RegularProductFormProps> = ({ 
  values, 
  setValues, 
  isSubmitting, 
  onSubmit, 
  enableSkuRegenerate, 
  onRegenerateSku, 
  categoryOptions,
  warehouseOptions 
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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Tên sản phẩm & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => setValues(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nhập tên sản phẩm"
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

      {/* Danh mục - CHỈ HIỂN THỊ DANH MỤC THƯỜNG (non-customizable) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
        <select
          value={values.category}
          onChange={(e) => setValues(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        >
          <option value="">Chọn danh mục</option>
          {(categoryOptions ?? [])
            .filter(opt => !opt.isCustomizable) // CHỈ LẤY DANH MỤC THƯỜNG
            .map(opt => (
              <option key={opt.value} value={opt.label}>{opt.label}</option>
            ))}
        </select>
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
        <textarea
          value={values.description}
          onChange={(e) => setValues(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Mô tả chi tiết về sản phẩm..."
        />
      </div>

      {/* Giá bán & Giá gốc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VND) *</label>
          <input
            type="number"
            value={values.price}
            onChange={(e) => setValues(prev => ({ ...prev, price: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="159000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giá gốc (VND)</label>
          <input
            type="number"
            value={values.originalPrice}
            onChange={(e) => setValues(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="199000"
          />
        </div>
      </div>

      {/* Tồn kho & Khối lượng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho *</label>
          <input
            type="number"
            value={values.stock}
            onChange={(e) => setValues(prev => ({ ...prev, stock: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Khối lượng (gram) *</label>
          <input
            type="number"
            step="1"
            min="1"
            value={values.weight}
            onChange={(e) => setValues(prev => ({ ...prev, weight: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="500"
            required
          />
        </div>
      </div>

      {/* Warehouse Selection */}
      {warehouseOptions && warehouseOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kho lưu trữ</label>
          <select
            value={values.primaryWarehouseId || ''}
            onChange={(e) => setValues(prev => ({ ...prev, primaryWarehouseId: e.target.value || undefined }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Chọn kho lưu trữ (tùy chọn)</option>
            {warehouseOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Sản phẩm sẽ được lưu trữ tại kho đã chọn</p>
        </div>
      )}

      {/* Hình ảnh sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Hình ảnh sản phẩm *</label>
        <div
          className={`border-2 ${isDragOver ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} rounded-xl p-5 mb-4 text-center cursor-pointer`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('regular-image-input')?.click()}
        >
          <input 
            id="regular-image-input" 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={(e) => handleFiles(e.target.files)} 
          />
          <div className="text-gray-600 text-sm">
            Kéo thả ảnh vào đây hoặc <span className="text-green-600 font-semibold">chọn từ máy</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Hỗ trợ nhiều ảnh, tối đa ~10 ảnh</div>
        </div>

        {values.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {values.images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border ${idx === 0 ? 'border-green-500' : 'border-gray-200'}`}>
                <img src={img} alt={`product-${idx}`} className="w-full h-36 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 flex justify-between text-xs text-white">
                  <button 
                    type="button" 
                    onClick={() => makePrimaryImage(idx)} 
                    className={`px-2 py-1 rounded ${idx === 0 ? 'bg-green-600' : 'bg-black/40 hover:bg-black/60'}`}
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

      {/* Màu sắc sản phẩm (Optional for regular products) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Màu sắc sản phẩm (Tùy chọn)</label>
        {values.colors.length === 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Chọn màu từ danh sách bên dưới để thêm vào sản phẩm (nếu có nhiều màu)
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {values.colors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div 
                className="w-12 h-12 rounded-xl border-2 border-gray-300 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
                className={`w-10 h-10 rounded-lg border-2 transition-all ${isSelected ? 'border-green-500 opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-green-400 hover:scale-105'}`} 
                style={{ backgroundColor: c.value }} 
                title={`${c.name}${isSelected ? ' (đã chọn)' : ''}`} 
              />
            )
          })}
        </div>
        
        {/* Hướng dẫn map ảnh theo màu */}
        {values.colors.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📸 Cách upload ảnh theo màu:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span><strong>Ảnh đầu tiên</strong> = Ảnh chính (hiển thị mặc định)</span>
                  </li>
                  {values.colors.map((color, idx) => {
                    const colorName = popularColors.find(c => c.value === color)?.name || color
                    return (
                      <li key={color} className="flex items-start gap-2">
                        <span className="font-bold">{idx + 2}.</span>
                        <span>
                          <strong>Ảnh thứ {idx + 2}</strong> → Tự động map với màu{' '}
                          <span 
                            className="inline-block w-4 h-4 rounded border border-gray-300 align-middle"
                            style={{ backgroundColor: color }}
                          />
                          {' '}<strong>{colorName}</strong>
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <p className="text-xs text-blue-600 mt-2 italic">
                  💡 Khách hàng chọn màu sẽ thấy ảnh tương ứng!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trạng thái */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
        <select
          value={values.status}
          onChange={(e) => setValues(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm thường'}
        </button>
      </div>
    </form>
  )
}

export default RegularProductForm
