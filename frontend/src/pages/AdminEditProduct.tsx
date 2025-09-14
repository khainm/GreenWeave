import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import { type ProductFormValues } from '../components/admin/ProductForm'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { CreateProductRequest, Product } from '../types/product'
import CustomProductModal from '../components/admin/CustomProductModal'
import {
  ProductEditHeader,
  ProductEditForm,
  ProductPreview,
  LoadingState,
  getProductType
} from '../components/admin/product-edit'

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
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <ProductEditHeader
          product={product}
          isCustomProduct={isCustomProduct}
          onOpenCustomModal={openCustomModal}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProductEditForm
            form={form}
            setForm={setForm}
            isSaving={isSaving}
            error={error}
            categoryOptions={categoryOptions}
            onSubmit={handleSubmit}
          />

          <ProductPreview
            form={form}
            product={product}
            isCustomProduct={isCustomProduct}
          />
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



