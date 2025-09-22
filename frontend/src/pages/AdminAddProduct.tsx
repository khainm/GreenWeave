import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import type { CreateProductRequest } from '../types/product'
import ProductForm, { type ProductFormValues } from '../components/admin/ProductForm'
import { formatVnd } from '../utils/format'
import CategoryService from '../services/categoryService'

const AdminAddProduct: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormValues>({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    weight: 500,
    colors: ['#10b981'],
    selectedColor: '#10b981',
    status: 'active',
    images: [],
    imageFiles: []
  })
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; isCustomizable: boolean }[]>([])

  // SKU helpers
  const generateSku = (category: string) => {
    return ProductService.generateSku(category)
  }

  useEffect(() => {
    setForm(prev => ({ ...prev, sku: prev.sku || generateSku(prev.category) }))
  }, [])

  // Regenerate SKU when category changes (for Add page behavior)
  useEffect(() => {
    if (form.category) {
      setForm(prev => ({ ...prev, sku: generateSku(prev.category) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await CategoryService.list()
        setCategoryOptions(cats
          .filter(c => c.status === 'active' && !c.isCustomizable)
          .sort((a,b) => a.sortOrder - b.sortOrder)
          .map(c => ({ label: c.name, value: String(c.id), isCustomizable: c.isCustomizable })))
      } catch (e) {
        // silently ignore for now
      }
    }
    loadCategories()
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Debug logging
      console.log('🔍 AdminAddProduct - Form values:', {
        name: form.name,
        weight: form.weight,
        weightType: typeof form.weight
      })
      
      const productData: CreateProductRequest = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        description: form.description || undefined,
        price: form.price,
        originalPrice: form.originalPrice > 0 ? form.originalPrice : undefined,
        stock: form.stock,
        weight: form.weight,
        status: form.status,
        colors: form.colors,
        imageUrls: form.images.filter(img => img.startsWith('http')), // Chỉ lấy URL
        imageFiles: form.imageFiles
      }
      
      console.log('🔍 AdminAddProduct - ProductData:', productData)

      const createdProduct = await ProductService.createProduct(productData)
      console.log('Product created successfully:', createdProduct)
      
      // Chuyển hướng về danh sách sản phẩm
      navigate('/admin/products')
    } catch (err) {
      console.error('Error creating product:', err)
      setError('Có lỗi xảy ra khi tạo sản phẩm. Vui lòng thử lại.')
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
          <h1 className="text-3xl font-bold text-gray-900">Thêm hàng hóa mới</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin sản phẩm</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
            )}
            <ProductForm
              values={form}
              setValues={setForm}
              isSubmitting={isLoading}
              onSubmit={handleSubmit}
              enableSkuRegenerate
              onRegenerateSku={() => setForm(prev => ({ ...prev, sku: generateSku(prev.category) }))}
              categoryOptions={categoryOptions}
              categoryIsCustomizable={categoryOptions.find(o => o.label === form.category)?.isCustomizable}
            />
            <div className="mt-4">
              <Link to="/admin/products" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Hủy</Link>
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
                    <span className="text-green-600 font-bold text-base">{form.price ? formatVnd(form.price) : '0'} đ</span>
                    {form.originalPrice > 0 && form.originalPrice > form.price && (
                      <span className="text-gray-400 text-sm line-through ml-2">{formatVnd(form.originalPrice)} đ</span>
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
