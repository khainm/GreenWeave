import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import RegularProductForm from '../components/admin/RegularProductForm'
import type { RegularProductFormValues } from '../components/admin/RegularProductForm'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import warehouseService from '../services/warehouseService'
import type { Product } from '../types/product'
import { formatVnd } from '../utils/format'

const AdminEditRegularProduct: React.FC = () => {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; isCustomizable?: boolean }[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<{ label: string; value: string }[]>([])
  const [product, setProduct] = useState<Product | null>(null)

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
    images: [],
    imageFiles: [],
    hasChangedImages: false,
    imageColorMode: 'shared'  // Mặc định: ảnh chung
  })

  // Load categories và warehouses
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const cats = await CategoryService.list()
        const categoryOpts = cats
          .filter(c => c.status === 'active' && !c.isCustomizable) // CHỈ LẤY DANH MỤC THƯỜNG
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

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setError('')
        const productData: Product = await ProductService.getProductById(productId)
        setProduct(productData)
        
        // Load existing color images previews from product data
        const colorImagePreviews: Record<string, string> = {}
        productData.images?.forEach((img) => {
          if (img.colorCode) {
            colorImagePreviews[img.colorCode] = img.imageUrl
          }
        })

        // Detect imageColorMode dựa trên dữ liệu ảnh hiện tại
        // Nếu có ảnh (không phải primary) có colorCode → mode = 'per-color'
        // Nếu không có ảnh nào có colorCode (trừ primary) → mode = 'shared'
        const hasColorMappedImages = productData.images?.some(img => !img.isPrimary && img.colorCode)
        const detectedMode: 'per-color' | 'shared' = hasColorMappedImages ? 'per-color' : 'shared'

        console.log('🔍 Detected imageColorMode:', detectedMode, {
          totalImages: productData.images?.length,
          colorMappedImages: productData.images?.filter(img => img.colorCode).length,
          hasColorMappedImages
        })

        setForm({
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          description: productData.description || '',
          price: productData.price ?? 0,
          originalPrice: productData.originalPrice || 0,
          stock: productData.stock ?? 0,
          weight: (productData.weight && productData.weight > 0) ? productData.weight : 500,
          colors: productData.colors?.map(c => c.colorCode) || [],
          selectedColor: productData.colors?.[0]?.colorCode || '',
          status: productData.status,
          primaryWarehouseId: productData.primaryWarehouseId,
          images: productData.images?.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl) || [],
          imageFiles: [],
          hasChangedImages: false,
          imageColorMode: detectedMode  // Auto-detect từ dữ liệu hiện tại
        })
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Không thể tải sản phẩm. Vui lòng thử lại.')
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

    try {
      const productData = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        description: form.description || undefined,
        price: form.price,
        originalPrice: form.originalPrice > 0 ? form.originalPrice : undefined,
        stock: form.stock,
        weight: form.weight,
        status: form.status,
        primaryWarehouseId: form.primaryWarehouseId,
        colors: form.colors,
        // Gửi cả ảnh cũ (imageUrls) và ảnh mới (imageFiles) để backend merge
        imageUrls: form.images.filter(img => img.startsWith('http')),
        imageFiles: form.imageFiles,
        imageColorMode: form.imageColorMode  // Gửi chế độ map ảnh lên backend
        // Backend tự động map ảnh theo thứ tự màu
      }

      console.log('🔍 AdminEditRegularProduct - Updating product:', productData)

      await ProductService.updateProduct(productId, productData)
      console.log('✅ Regular product updated successfully')

      // Invalidate cache
      ProductService.invalidateCache()
      console.log('✅ Cache invalidated after product update')

      // Redirect to products list
      navigate('/admin/products')
    } catch (err) {
      console.error('❌ Error updating regular product:', err)
      setError('Có lỗi xảy ra khi cập nhật sản phẩm thường. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <TopNav />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Không tìm thấy sản phẩm</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Sửa sản phẩm thường</h1>
            <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
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
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
              enableSkuRegenerate={false}
              categoryOptions={categoryOptions}
              warehouseOptions={warehouseOptions}
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
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
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
                    src={form.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={form.name || 'Sản phẩm'}
                    className="w-full h-full object-cover"
                  />
                  {form.status === 'active' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {form.name || 'Tên sản phẩm'}
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
                💡 Xem trước sản phẩm sau khi cập nhật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEditRegularProduct
