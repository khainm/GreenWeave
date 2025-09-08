import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'

type ProductForm = {
  name: string
  sku: string
  category: string
  description: string
  price: number
  originalPrice: number
  stock: number
  colors: string[]
  selectedColor: string
  status: 'active' | 'inactive'
  images: string[]
}

const AdminAddProduct: React.FC = () => {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    colors: ['#10b981'],
    selectedColor: '#10b981',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80']
  })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // SKU helpers
  const prefixMap: Record<string, string> = { 'Non-stop': 'NON', 'Trơn': 'TRON', 'Thêu': 'THEU' }
  const generateSku = (category: string) => {
    const prefix = prefixMap[category] || 'GW'
    const rand = Math.floor(1000 + Math.random() * 9000) // 4 digits
    return `${prefix}${rand}`
  }

  useEffect(() => {
    // initial SKU when page loads
    setForm(prev => ({ ...prev, sku: prev.sku || generateSku(prev.category) }))
  }, [])

  // Predefined popular colors
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

  const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Product data:', form)
    // TODO: Submit to API
  }

  // Images handlers
  const addImageUrl = () => {
    const url = imageUrlInput.trim()
    if (!url) return
    try {
      new URL(url)
      setForm(prev => ({ ...prev, images: [...prev.images, url] }))
      setImageUrlInput('')
    } catch {
      // ignore invalid URL for now; could show toast
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const readers = Array.from(files).slice(0, 10).map(file => new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    }))
    const results = await Promise.all(readers)
    setForm(prev => ({ ...prev, images: [...prev.images, ...results] }))
  }

  const removeImageByIndex = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const makePrimaryImage = (index: number) => {
    setForm(prev => {
      if (index === 0) return prev
      const copy = [...prev.images]
      const [img] = copy.splice(index, 1)
      return { ...prev, images: [img, ...copy] }
    })
  }

  const addPopularColor = (color: string) => {
    if (!form.colors.includes(color)) {
      setForm(prev => ({ 
        ...prev, 
        colors: [...prev.colors, color],
        selectedColor: prev.colors.length === 0 ? color : prev.selectedColor
      }))
    }
  }

  const addCustomColor = (color: string) => {
    if (!form.colors.includes(color)) {
      setForm(prev => ({ 
        ...prev, 
        colors: [...prev.colors, color]
      }))
    }
  }

  const removeColor = (index: number) => {
    const colorToRemove = form.colors[index]
    setForm(prev => ({ 
      ...prev, 
      colors: prev.colors.filter((_, i) => i !== index),
      selectedColor: prev.selectedColor === colorToRemove ? prev.colors[0] || '#10b981' : prev.selectedColor
    }))
  }

  const updateColor = (index: number, newColor: string) => {
    const newColors = [...form.colors]
    const oldColor = newColors[index]
    newColors[index] = newColor
    setForm(prev => ({ 
      ...prev, 
      colors: newColors,
      selectedColor: prev.selectedColor === oldColor ? newColor : prev.selectedColor
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/admin/products" 
            className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Thêm hàng hóa mới</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin sản phẩm</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập tên sản phẩm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã SKU (tự động)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={form.sku}
                      readOnly
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, sku: generateSku(prev.category) }))}
                      className="px-3 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
                    >
                      Tạo lại
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">SKU sẽ tự tạo theo danh mục. Bạn có thể bấm "Tạo lại" để đổi mã.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value, sku: generateSku(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  <option value="Non-stop">Non-stop</option>
                  <option value="Trơn">Trơn</option>
                  <option value="Thêu">Thêu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VND) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="159000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá gốc (VND)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="199000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Hình ảnh sản phẩm</label>

                {/* Drop zone */}
                <div
                  className={`border-2 ${isDragOver ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} rounded-xl p-5 mb-4 text-center cursor-pointer`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
                  onClick={() => document.getElementById('image-input-hidden')?.click()}
                >
                  <input id="image-input-hidden" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  <div className="text-gray-600 text-sm">
                    Kéo thả ảnh vào đây hoặc <span className="text-green-600 font-semibold">chọn từ máy</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Hỗ trợ nhiều ảnh, tối đa ~10 ảnh/ lần thêm</div>
                </div>

                {/* Add by URL */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Dán URL ảnh..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button type="button" onClick={addImageUrl} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">Thêm URL</button>
                </div>

                {/* Thumbnails */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {form.images.map((img, idx) => (
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

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Màu sắc sản phẩm</label>
                
                {/* Selected Colors */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Màu đã chọn ({form.colors.length})</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {form.colors.map((color, idx) => (
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
                        {form.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                            title="Xóa màu này"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Colors */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Màu phổ biến</div>
                  <div className="grid grid-cols-6 gap-2">
                    {popularColors.map((colorObj) => {
                      const isSelected = form.colors.includes(colorObj.value)
                      return (
                        <button
                          key={colorObj.value}
                          type="button"
                          onClick={() => addPopularColor(colorObj.value)}
                          disabled={isSelected}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-green-500 opacity-50 cursor-not-allowed' 
                              : 'border-gray-300 hover:border-green-400 hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorObj.value }}
                          title={`${colorObj.name}${isSelected ? ' (đã chọn)' : ''}`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Custom Color */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Màu tùy chỉnh</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      onChange={(e) => addCustomColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-300 cursor-pointer"
                      title="Chọn màu tùy chỉnh"
                    />
                    <span className="text-sm text-gray-500">Click để thêm màu tùy chỉnh</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Thêm sản phẩm
                </button>
                <Link
                  to="/admin/products"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </Link>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Xem trước sản phẩm</h2>
            
            <div className="max-w-sm mx-auto">
              {/* Product Card Preview */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Image */}
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={form.images[0]}
                    alt={form.name || 'Sản phẩm mới'}
                    className="w-full h-full object-cover"
                  />
                  {form.status === 'active' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      NEW
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {form.name || 'Tên sản phẩm sẽ hiển thị ở đây'}
                  </h3>
                  
                  {form.description && (
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {form.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-green-600 font-bold text-base">
                      {form.price ? formatVnd(form.price) : '0'} đ
                    </span>
                    {form.originalPrice > 0 && form.originalPrice > form.price && (
                      <span className="text-gray-400 text-sm line-through ml-2">
                        {formatVnd(form.originalPrice)} đ
                      </span>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="flex space-x-2">
                    {form.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setForm(prev => ({ ...prev, selectedColor: color }))}
                        className="w-4 h-4 rounded-full border-2 transition-all"
                        style={{ 
                          backgroundColor: color,
                          borderColor: form.selectedColor === color ? '#10b981' : '#e5e7eb'
                        }}
                      />
                    ))}
                  </div>

                  {/* Stock info */}
                  <div className="mt-3 text-xs text-gray-500">
                    Còn {form.stock} sản phẩm
                  </div>
                </div>
              </div>

              {/* Preview info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                💡 Đây là cách sản phẩm sẽ hiển thị cho khách hàng
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAddProduct
