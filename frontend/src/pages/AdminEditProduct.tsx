import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import ProductForm, { type ProductFormValues } from '../components/admin/ProductForm'
import ProductService from '../services/productService'
import type { CreateProductRequest, Product } from '../types/product'

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
    const load = async () => {
      try {
        setError(null)
        const product: Product = await ProductService.getProductById(productId)
        setForm({
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description || '',
          price: product.price,
          originalPrice: product.originalPrice || 0,
          stock: product.stock,
          colors: product.colors?.map(c => c.colorCode) || ['#10b981'],
          selectedColor: product.colors?.[0]?.colorCode || '#10b981',
          status: product.status,
          images: product.images?.sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl) || [],
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
  }, [productId])

  const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

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
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa hàng hóa</h1>
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
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEditProduct



