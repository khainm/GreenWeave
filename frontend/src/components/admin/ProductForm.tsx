import React, { useState } from 'react'

export type ProductFormValues = {
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
  images: string[]
  imageFiles: File[]
  hasChangedImages?: boolean // Flag để track khi có thay đổi ảnh
}

type ProductFormProps = {
  values: ProductFormValues
  setValues: React.Dispatch<React.SetStateAction<ProductFormValues>>
  isSubmitting?: boolean
  onSubmit: (e: React.FormEvent) => void
  enableSkuRegenerate?: boolean
  onRegenerateSku?: () => void
  categoryOptions?: { label: string; value: string; isCustomizable?: boolean }[]
  categoryIsCustomizable?: boolean
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

const ProductForm: React.FC<ProductFormProps> = ({ values, setValues, isSubmitting, onSubmit, enableSkuRegenerate, onRegenerateSku, categoryOptions, categoryIsCustomizable }) => {
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
      
      // Nếu xóa ảnh mới (base64), cần xóa cả file tương ứng
      let newImageFiles = prev.imageFiles
      if (removedImage.startsWith('data:')) {
        // Đếm số ảnh base64 trước vị trí hiện tại để tìm index trong imageFiles
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
    setValues(prev => ({ ...prev, colors: newColors, selectedColor: prev.selectedColor === oldColor ? newColor : prev.selectedColor }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
              <button type="button" onClick={onRegenerateSku} className="px-3 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">Tạo lại</button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
        <div className="relative">
          <select
            value={values.category}
            onChange={(e) => setValues(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-28"
            required
          >
            <option value="">Chọn danh mục</option>
            {(categoryOptions ?? []).map(opt => (
              <option key={opt.value} value={opt.label}>{opt.label}</option>
            ))}
          </select>
          {categoryIsCustomizable && (
            <span className="absolute top-1/2 -translate-y-1/2 right-2 inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/></svg>
              Tuỳ chỉnh
            </span>
          )}
        </div>
        {categoryIsCustomizable && (
          <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
            Danh mục này hỗ trợ tạo sản phẩm tuỳ chỉnh.
          </p>
        )}
      </div>

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Hình ảnh sản phẩm</label>
        <div
          className={`border-2 ${isDragOver ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} rounded-xl p-5 mb-4 text-center cursor-pointer`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('image-input-hidden')?.click()}
        >
          <input id="image-input-hidden" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="text-gray-600 text-sm">Kéo thả ảnh vào đây hoặc <span className="text-green-600 font-semibold">chọn từ máy</span></div>
          <div className="text-xs text-gray-400 mt-1">Hỗ trợ nhiều ảnh, tối đa ~10 ảnh/ lần thêm</div>
        </div>

        {values.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {values.images.map((img, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden border ${idx === 0 ? 'border-green-500' : 'border-gray-200'}`}>
                <img src={img} alt={`product-${idx}`} className="w-full h-36 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 flex justify-between text-xs text-white">
                  <button type="button" onClick={() => makePrimaryImage(idx)} className={`px-2 py-1 rounded ${idx === 0 ? 'bg-green-600' : 'bg-black/40 hover:bg-black/60'}`}>{idx === 0 ? 'Ảnh chính' : 'Đặt làm chính'}</button>
                  <button type="button" onClick={() => removeImageByIndex(idx)} className="px-2 py-1 bg-red-600 rounded hover:bg-red-700">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Màu sắc sản phẩm</label>
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
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {popularColors.map((c) => {
            const isSelected = values.colors.includes(c.value)
            return (
              <button key={c.value} type="button" onClick={() => addCustomColor(c.value)} disabled={isSelected} className={`w-10 h-10 rounded-lg border-2 transition-all ${isSelected ? 'border-green-500 opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-green-400 hover:scale-105'}`} style={{ backgroundColor: c.value }} title={`${c.name}${isSelected ? ' (đã chọn)' : ''}`} />
            )
          })}
        </div>
      </div>

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

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}

export default ProductForm


