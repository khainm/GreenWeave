import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import RegularProductForm from '../components/admin/RegularProductForm'
import type { RegularProductFormValues } from '../components/admin/RegularProductForm'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import warehouseService from '../services/warehouseService'
import { formatVnd } from '../utils/format'

const placeholderImage = 'https://via.placeholder.com/300x300?text=No+Image'

const generateSku = (categoryName: string): string => {
  const prefix = categoryName.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${prefix}-${timestamp}${random}`
}

const AdminAddRegularProduct: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; isCustomizable?: boolean }[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<{ label: string; value: string }[]>([])

  const [form, setForm] = useState<RegularProductFormValues>({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    weight: 0,
    colors: [],
    selectedColor: '',
    status: 'active',
    primaryWarehouseId: undefined,
    images: [placeholderImage],
    imageFiles: [],
    hasChangedImages: false
  })

  // Load categories và warehouses
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories - CHỈ DANH MỤC THƯỜNG (không customizable)
        const cats = await CategoryService.list()
        const categoryOpts = cats
          .filter(c => c.status === 'active' && !c.isCustomizable)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(c => ({ label: c.name, value: String(c.id), isCustomizable: c.isCustomizable }))
        setCategoryOptions(categoryOpts)

        // Load warehouses
        const warehouseResponse = await warehouseService.getAllWarehouses()
        const warehouseOpts = warehouseResponse.warehouses?.map((w: any) => ({ 
          label: w.name, 
          value: w.id 
        })) || []
        setWarehouseOptions(warehouseOpts)
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  // Auto generate SKU khi chọn category
  useEffect(() => {
    if (form.category && !form.sku) {
      setForm(prev => ({ ...prev, sku: generateSku(prev.category) }))
    }
  }, [form.category, form.sku])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const productData = {
        name: form.name,
        sku: form.sku,
        category: form.category, // Use 'category' not 'categoryName'
        description: form.description || undefined,
        price: form.price,
        originalPrice: form.originalPrice > 0 ? form.originalPrice : undefined,
        stock: form.stock,
        weight: form.weight,
        status: form.status,
        primaryWarehouseId: form.primaryWarehouseId,
        colors: form.colors,
        imageUrls: form.images.filter(img => img.startsWith('http')),
        imageFiles: form.imageFiles
        // Backend tự động map ảnh theo thứ tự: ảnh đầu = ảnh chính, các ảnh sau map với màu
      }

      console.log('🔍 AdminAddRegularProduct - Creating product:', productData)

      const createdProduct = await ProductService.createProduct(productData)
      console.log('✅ Regular product created successfully:', createdProduct)

      // Invalidate cache
      ProductService.invalidateCache()
      console.log('✅ Cache invalidated after product creation')

      // Redirect to products list
      navigate('/admin/products')
    } catch (err) {
      console.error('❌ Error creating regular product:', err)
      setError('Có lỗi xảy ra khi tạo sản phẩm thường. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thêm sản phẩm thường</h1>
            <p className="text-sm text-gray-500 mt-1">Sản phẩm không có tính năng tuỳ chỉnh</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin sản phẩm</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}
            <RegularProductForm
              values={form}
              setValues={setForm}
              isSubmitting={isLoading}
              onSubmit={handleSubmit}
              enableSkuRegenerate
              onRegenerateSku={() => setForm(prev => ({ ...prev, sku: generateSku(prev.category) }))}
              categoryOptions={categoryOptions}
              warehouseOptions={warehouseOptions}
            />
            <div className="mt-4">
              <Link 
                to="/admin/products" 
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors inline-block"
              >
                Hủy
              </Link>
            </div>
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
                  {form.colors.length > 0 && (
                    <div className="flex space-x-2 mb-3">
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
                  )}

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

export default AdminAddRegularProduct
