import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import ProductForm, { type ProductFormValues } from '../components/admin/ProductForm'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { CreateProductRequest, Product } from '../types/product'
import CustomProductModal from '../components/admin/CustomProductModal'

// Helper function to determine product type
const getProductType = (product: Product, categoryMeta: Record<string, { isCustomizable: boolean }>): 'regular' | 'custom' => {
  // Product is custom if it has stickers OR if its category is customizable
  const hasStickers = product.stickers && product.stickers.length > 0
  const isCategoryCustomizable = categoryMeta[product.category]?.isCustomizable || false
  return (hasStickers || isCategoryCustomizable) ? 'custom' : 'regular'
}

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
  imageFiles: File[]
}

const AdminEditProduct: React.FC = () => {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; isCustomizable: boolean }[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [isCustomProduct, setIsCustomProduct] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { isCustomizable: boolean }>>({})
  const [form, setForm] = useState<ProductFormValues>({
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
    images: [],
    imageFiles: []
  })
  // local drag state removed after form extraction

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await CategoryService.list()
        const options = cats
          .filter(c => c.status === 'active')
          .sort((a,b) => a.sortOrder - b.sortOrder)
          .map(c => ({ label: c.name, value: String(c.id), isCustomizable: c.isCustomizable }))
        
        setCategoryOptions(options)
        
        // Build categoryMeta for product type detection
        const meta: Record<string, { isCustomizable: boolean }> = {}
        cats.forEach(c => { meta[c.name] = { isCustomizable: c.isCustomizable } })
        setCategoryMeta(meta)
      } catch (e) {
        // silently ignore for now
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const productData: Product = await ProductService.getProductById(productId)
        setProduct(productData)
        
        // Xác định loại sản phẩm
        const productType = getProductType(productData, categoryMeta)
        setIsCustomProduct(productType === 'custom')
        
        setForm({
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          description: productData.description || '',
          price: productData.price,
          originalPrice: productData.originalPrice || 0,
          stock: productData.stock,
          colors: productData.colors?.map(c => c.colorCode) || ['#10b981'],
          selectedColor: productData.colors?.[0]?.colorCode || '#10b981',
          status: productData.status,
          images: productData.images?.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl) || [],
          imageFiles: []
        })
      } catch (e) {
        console.error(e)
        setError('Không thể tải sản phẩm')
      } finally {
        setIsLoading(false)
      }
    }
    if (!Number.isFinite(productId)) {
      setError('ID sản phẩm không hợp lệ')
      setIsLoading(false)
      return
    }
    load()
  }, [productId, categoryMeta])

  const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

  // Handlers for Custom modal
  const openCustomModal = () => setShowCustomModal(true)
  const closeCustomModal = () => setShowCustomModal(false)

  const handleCustomProductUpdated = (updatedProduct: Product) => {
    setProduct(updatedProduct)
    // Reload the page to refresh data
    window.location.reload()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const payload: CreateProductRequest = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        description: form.description || undefined,
        price: form.price,
        originalPrice: form.originalPrice > 0 ? form.originalPrice : undefined,
        stock: form.stock,
        status: form.status,
        colors: form.colors,
        imageUrls: form.images.filter(img => img.startsWith('http')),
        imageFiles: form.imageFiles
      }

      await ProductService.updateProduct(productId, payload)
      navigate('/admin/products')
    } catch (e) {
      console.error(e)
      setError('Có lỗi xảy ra khi cập nhật sản phẩm')
    } finally {
      setIsSaving(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="max-w-7xl mx-auto px-6 py-8">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa hàng hóa</h1>
            {product && (
              <div className="flex items-center gap-2 mt-1">
                {isCustomProduct ? (
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Sản phẩm tùy chỉnh
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Sản phẩm thường
                  </span>
                )}
                {product.stickers && product.stickers.length > 0 && (
                  <span className="text-xs text-gray-500">
                    ({product.stickers.length} stickers)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Thông tin sản phẩm</h2>
              {isCustomProduct && (
                <button
                  onClick={openCustomModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Chỉnh sửa tùy chỉnh
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
            )}

            <ProductForm
              values={form}
              setValues={setForm}
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
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
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={form.images[0]}
                    alt={form.name || 'Sản phẩm'}
                    className="w-full h-full object-cover"
                  />
                  {isCustomProduct && product?.stickers && product.stickers.length > 0 && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {product.stickers.length} stickers
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{form.name || 'Tên sản phẩm'}</h3>
                  {form.description && (
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">{form.description}</p>
                  )}
                  <div className="mb-3">
                    <span className="text-green-600 font-bold text-base">{formatVnd(form.price)} đ</span>
                    {form.originalPrice > 0 && form.originalPrice > form.price && (
                      <span className="text-gray-400 text-sm line-through ml-2">{formatVnd(form.originalPrice)} đ</span>
                    )}
                  </div>
                  
                  {/* Stickers info for custom products */}
                  {isCustomProduct && product?.stickers && product.stickers.length > 0 && (
                    <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                      <div className="text-xs text-purple-700 font-medium mb-1">Stickers có sẵn:</div>
                      <div className="flex flex-wrap gap-1">
                        {product.stickers.slice(0, 3).map((sticker, idx) => (
                          <div key={idx} className="w-6 h-6 bg-white border border-purple-200 rounded flex items-center justify-center">
                            <img 
                              src={sticker.imageUrl} 
                              alt={`sticker-${idx}`}
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        ))}
                        {product.stickers.length > 3 && (
                          <div className="w-6 h-6 bg-purple-200 text-purple-600 text-xs flex items-center justify-center rounded">
                            +{product.stickers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom Product Modal */}
        {showCustomModal && product && (
          <CustomProductModal
            open={showCustomModal}
            onClose={closeCustomModal}
            onCreated={handleCustomProductUpdated}
            initialProduct={product}
          />
        )}
      </div>
    </div>
  )
}

export default AdminEditProduct



