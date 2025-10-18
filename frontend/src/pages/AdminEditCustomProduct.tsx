import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import CustomProductForm from '../components/admin/CustomProductForm'
import type { CustomProductFormValues } from '../components/admin/CustomProductForm'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { Product } from '../types/product'

const AdminEditCustomProduct: React.FC = () => {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; isCustomizable?: boolean }[]>([])
  const [product, setProduct] = useState<Product | null>(null)

  const [form, setForm] = useState<CustomProductFormValues>({
    name: '',
    sku: '',
    category: '',
    description: '',
    consultationNote: '',
    colors: [],
    selectedColor: '',
    status: 'active',
    images: [],
    imageFiles: [],
    hasChangedImages: false
  })

  // Load categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await CategoryService.list()
        const categoryOpts = cats
          .filter(c => c.status === 'active' && c.isCustomizable) // CHỈ LẤY DANH MỤC CUSTOM
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(c => ({ label: c.name, value: String(c.id), isCustomizable: c.isCustomizable }))
        setCategoryOptions(categoryOpts)
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setError('')
        const productData: Product = await ProductService.getProductById(productId)
        setProduct(productData)
        
        setForm({
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          description: productData.description || '',
          consultationNote: productData.consultationNote || '',
          colors: productData.colors?.map(c => c.colorCode) || [],
          selectedColor: productData.colors?.[0]?.colorCode || '',
          status: productData.status,
          images: productData.images?.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl) || [],
          imageFiles: [],
          hasChangedImages: false
        })
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Không thể tải sản phẩm tuỳ chỉnh. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    }

    if (!Number.isFinite(productId)) {
      setError('ID sản phẩm không hợp lệ')
      setIsLoading(false)
      return
    }

    loadProduct()
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    // Validate: At least 1 color is required for custom products
    if (form.colors.length === 0) {
      setError('Sản phẩm tuỳ chỉnh phải có ít nhất 1 màu sắc!')
      setIsSaving(false)
      return
    }

    try {
      const productData = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        description: form.description || undefined,
        consultationNote: form.consultationNote || undefined,
        status: form.status,
        colors: form.colors,
        // Nếu có thay đổi ảnh, gửi imageFiles; nếu không, gửi imageUrls để giữ nguyên
        ...(form.hasChangedImages 
          ? { imageFiles: form.imageFiles }
          : { imageUrls: form.images.filter(img => img.startsWith('http')) }
        )
      }

      console.log('🔍 AdminEditCustomProduct - Updating custom product:', productData)

      await ProductService.updateProduct(productId, productData)
      console.log('✅ Custom product updated successfully')

      // Invalidate cache
      ProductService.invalidateCache()
      console.log('✅ Cache invalidated after product update')

      // Redirect to products list
      navigate('/admin/products')
    } catch (err) {
      console.error('❌ Error updating custom product:', err)
      setError('Có lỗi xảy ra khi cập nhật sản phẩm tuỳ chỉnh. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <TopNav />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600">Đang tải sản phẩm tuỳ chỉnh...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Không tìm thấy sản phẩm tuỳ chỉnh</p>
            <Link 
              to="/admin/products" 
              className="mt-4 inline-block px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/admin/products" 
            className="p-2 rounded-xl border border-indigo-300 hover:bg-white/50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Sửa sản phẩm tuỳ chỉnh
            </h1>
            <p className="text-sm text-indigo-600 mt-1 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/>
              </svg>
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin sản phẩm tuỳ chỉnh</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}
            <CustomProductForm
              values={form}
              setValues={setForm}
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
              enableSkuRegenerate={false}
              categoryOptions={categoryOptions}
            />
            <div className="mt-4 flex gap-3">
              <Link 
                to="/admin/products" 
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </Link>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Xem trước sản phẩm</h2>
            
            <div className="max-w-sm mx-auto">
              {/* Product Card Preview */}
              <div className="bg-white border-2 border-indigo-200 rounded-xl overflow-hidden shadow-md">
                {/* Image */}
                <div className="relative h-64 bg-gradient-to-br from-indigo-100 to-purple-100">
                  <img
                    src={form.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={form.name || 'Sản phẩm tuỳ chỉnh'}
                    className="w-full h-full object-cover"
                  />
                  {form.status === 'active' && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ✨ ACTIVE
                    </div>
                  )}
                  {/* Custom badge */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z"/>
                    </svg>
                    Tuỳ chỉnh
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {form.name || 'Tên sản phẩm tuỳ chỉnh'}
                  </h3>
                  
                  {form.description && (
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {form.description}
                    </p>
                  )}

                  {/* Price info for custom products */}
                  <div className="mb-3">
                    <span className="text-indigo-600 font-semibold text-sm">
                      💬 Liên hệ để báo giá
                    </span>
                  </div>

                  {/* Colors */}
                  <div className="mb-3">
                    {form.colors.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Màu:</span>
                        <div className="flex space-x-2">
                          {form.colors.map((color, idx) => (
                            <button
                              key={idx}
                              onClick={() => setForm(prev => ({ ...prev, selectedColor: color }))}
                              className="w-5 h-5 rounded-full border-2 transition-all shadow-sm"
                              style={{ 
                                backgroundColor: color,
                                borderColor: form.selectedColor === color ? '#6366f1' : '#e5e7eb',
                                transform: form.selectedColor === color ? 'scale(1.1)' : 'scale(1)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-xs font-medium">Chưa chọn màu</span>
                      </div>
                    )}
                  </div>

                  {/* Customization info */}
                  <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-700 font-medium flex items-center gap-1">
                      🎨 Khách hàng có thể tuỳ chỉnh
                    </p>
                  </div>

                  {/* Consultation note */}
                  {form.consultationNote && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
                      ℹ️ {form.consultationNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview info */}
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                💡 Xem trước sản phẩm tuỳ chỉnh sau khi cập nhật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEditCustomProduct
