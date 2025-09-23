import React, { useEffect, useRef, useState } from 'react'
import type { Product, CreateProductRequest } from '../../types/product'
import ProductService from '../../services/productService'
import CategoryService from '../../services/categoryService'
import warehouseService from '../../services/warehouseService'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (product: Product) => void
  initialProduct?: Product
}

const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

const CustomProductModal: React.FC<Props> = ({ open, onClose, onCreated, initialProduct }) => {
  const [customForm, setCustomForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    weight: 500,
    description: '',
    selectedColor: '#ffffff' as string,
    primaryWarehouseId: '' as string,
  })
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [categories, setCategories] = useState<Array<{ name: string; isCustomizable: boolean }>>([])
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [colors, setColors] = useState<string[]>(['#ffffff', '#000000'])
  const [pendingColor, setPendingColor] = useState<string>('#10b981')
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([])
  const [stickerFiles, setStickerFiles] = useState<File[]>([])
  const [stickerUrls, setStickerUrls] = useState<string[]>([]) // URLs từ internet
  const [stickerUrl, setStickerUrl] = useState('')
  const [isAddingStickerUrl, setIsAddingStickerUrl] = useState(false)
  type PlacedSticker = { id: string; src: string; x: number; y: number; scale: number }
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([])
  const previewRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<null | { id: string; offsetX: number; offsetY: number; containerLeft: number; containerTop: number }>(null)
  const [resizeState, setResizeState] = useState<null | { id: string; startX: number; startY: number; startScale: number }>(null)
  const [isSavingCustom, setIsSavingCustom] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (!open) return
    // load categories (only customizable)
    CategoryService.list().then(list => {
      setCategories(list?.map((c: any) => ({ name: c.name, isCustomizable: c.isCustomizable })) || [])
    }).catch(() => setCategories([]))

    // load warehouses
    warehouseService.getAllWarehouses().then(response => {
      setWarehouses(response.warehouses?.map((w: any) => ({ id: w.id, name: w.name })) || [])
    }).catch(() => setWarehouses([]))
  }, [open])

  // Helper function để phân biệt sticker từ file vs URL
  const categorizeStickers = (stickers: any[]) => {
    const urlStickers: string[] = []
    const allStickers: string[] = []
    
    stickers.forEach(sticker => {
      const imageUrl = sticker.imageUrl
      allStickers.push(imageUrl)
      
      // Phân biệt: nếu URL không phải từ Cloudinary upload và không phải base64 thì là URL trực tiếp
      // Cloudinary URLs thường có pattern như: https://res.cloudinary.com/...
      // Base64 images: data:image/...
      if (!imageUrl.includes('cloudinary.com') && !imageUrl.startsWith('data:image/')) {
        urlStickers.push(imageUrl)
      }
    })
    
    return { urlStickers, allStickers }
  }

  // Initialize form when initialProduct is provided
  useEffect(() => {
    if (initialProduct && open) {
      setIsEditMode(true)
      setCustomForm({
        name: initialProduct.name,
        sku: initialProduct.sku,
        category: initialProduct.category,
        price: initialProduct.price,
        weight: initialProduct.weight,
        description: initialProduct.description || '',
        selectedColor: initialProduct.colors?.[0]?.colorCode || '#ffffff',
        primaryWarehouseId: initialProduct.primaryWarehouseId || ''
      })
      setImages(initialProduct.images?.map(img => img.imageUrl) || [])
      setColors(initialProduct.colors?.map(c => c.colorCode) || ['#ffffff', '#000000'])
      
      // Phân loại stickers khi load edit
      if (initialProduct.stickers && initialProduct.stickers.length > 0) {
        const { urlStickers, allStickers } = categorizeStickers(initialProduct.stickers)
        
        setStickerLibrary(allStickers) // Tất cả stickers để hiển thị trong library
        setStickerUrls(urlStickers) // Chỉ các URL trực tiếp (không phải từ file upload)
        
        // Load stickers into placedStickers for preview
        const placed = initialProduct.stickers.map((sticker, idx) => ({
          id: `sticker-${sticker.id || idx}`,
          src: sticker.imageUrl,
          x: 50 + (idx * 20), // Spread them out
          y: 50 + (idx * 20),
          scale: 1
        }))
        setPlacedStickers(placed)
      } else {
        setStickerLibrary([])
        setStickerUrls([])
        setPlacedStickers([])
      }
      
      // Reset file arrays cho edit mode
      setStickerFiles([])
    } else if (open) {
      setIsEditMode(false)
      // Reset form for new product
      setCustomForm({
        name: '',
        sku: '',
        category: '',
        price: 0,
        weight: 500,
        description: '',
        selectedColor: '#ffffff',
        primaryWarehouseId: ''
      })
      setImages([])
      setColors(['#ffffff', '#000000'])
      setStickerLibrary([])
      setStickerUrls([])
      setPlacedStickers([])
      setStickerFiles([])
    }
  }, [initialProduct, open])

  useEffect(() => {
    if (customForm.category) {
      setCustomForm(prev => ({ ...prev, sku: prev.sku || ProductService.generateSku(prev.category) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customForm.category])

  // Upload ảnh chung (không theo màu) - giống AdminAddProduct
  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const base64s = await Promise.all(files.map(f => ProductService.fileToBase64(f)))
    setImages(prev => [...prev, ...base64s])
    setImageFiles(prev => [...prev, ...files])
  }

  const handleAddStickerFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const base64s = await Promise.all(files.map(f => ProductService.fileToBase64(f)))
    setStickerLibrary(prev => [...prev, ...base64s])
    setStickerFiles(prev => [...prev, ...files])
    
    // Tự động đặt stickers vào preview
    base64s.forEach((src, idx) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}-${idx}`
      setPlacedStickers(prev => [...prev, { 
        id, 
        src, 
        x: 40 + (prev.length + idx) * 10, 
        y: 40 + (prev.length + idx) * 10, 
        scale: 1 
      }])
    })
  }

  const addStickerFromUrl = async () => {
    if (!stickerUrl.trim()) return
    
    setIsAddingStickerUrl(true)
    try {
      // Validate URL
      new URL(stickerUrl)
      
      // Add to both sticker library (for preview) and stickerUrls (for backend)
      const url = stickerUrl.trim()
      setStickerLibrary(prev => [...prev, url])
      setStickerUrls(prev => [...prev, url])
      
      // Tự động đặt sticker vào preview
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setPlacedStickers(prev => [...prev, { 
        id, 
        src: url, 
        x: 40 + prev.length * 10, 
        y: 40 + prev.length * 10, 
        scale: 1 
      }])
      
      setStickerUrl('')
    } catch (error) {
      alert('URL không hợp lệ. Vui lòng nhập URL ảnh hợp lệ.')
    } finally {
      setIsAddingStickerUrl(false)
    }
  }


  const placeStickerFromLibrary = (src: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setPlacedStickers(prev => [...prev, { id, src, x: 40 + prev.length * 10, y: 40 + prev.length * 10, scale: 1 }])
  }

  // Xử lý xóa sticker đã được đặt trên preview
  const removePlacedSticker = (stickerId: string | number) => {
    setPlacedStickers(prev => prev.filter(sticker => sticker.id !== stickerId))
  }

  const onStickerMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const containerRect = previewRef.current?.getBoundingClientRect()
    setDragState({ 
      id, 
      offsetX: e.clientX - rect.left, 
      offsetY: e.clientY - rect.top,
      containerLeft: containerRect?.left || 0,
      containerTop: containerRect?.top || 0
    })
  }

  const onResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const sticker = placedStickers.find(s => s.id === id)
    if (!sticker) return
    setResizeState({ id, startX: e.clientX, startY: e.clientY, startScale: sticker.scale })
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragState) {
        setPlacedStickers(prev => prev.map(s => s.id === dragState.id ? { ...s, x: e.clientX - dragState.containerLeft - dragState.offsetX, y: e.clientY - dragState.containerTop - dragState.offsetY } : s))
      } else if (resizeState) {
        const dx = e.clientX - resizeState.startX
        const dy = e.clientY - resizeState.startY
        const delta = Math.max(dx, dy)
        const newScale = Math.max(0.2, Math.min(3, resizeState.startScale + delta / 200))
        setPlacedStickers(prev => prev.map(s => s.id === resizeState.id ? { ...s, scale: newScale } : s))
      }
    }
    const onMouseUp = () => {
      if (dragState) setDragState(null)
      if (resizeState) setResizeState(null)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragState, resizeState])

  const addColor = (hex: string) => {
    const color = hex.toLowerCase()
    setColors(prev => (prev.includes(color) ? prev : [...prev, color]))
    setCustomForm(prev => ({ ...prev, selectedColor: color }))
  }
  const removeColor = (hex: string) => {
    setColors(prev => prev.filter(c => c !== hex))
    setCustomForm(prev => {
      if (prev.selectedColor === hex) {
        const next = (colors.find(c => c !== hex) || '#ffffff')
        return { ...prev, selectedColor: next }
      }
      return prev
    })
  }

  const handleSaveCustomProduct = async () => {
    try {
      setIsSavingCustom(true)
      setSaveError(null)
      if (!customForm.name || !customForm.category || !customForm.sku) {
        setSaveError('Vui lòng nhập Tên, Danh mục và SKU')
        setIsSavingCustom(false)
        return
      }
      
      // Chuẩn bị payload với stickers được phân loại đúng
      const payload: CreateProductRequest = {
        name: customForm.name,
        sku: customForm.sku,
        category: customForm.category,
        description: customForm.description || undefined,
        price: customForm.price,
        originalPrice: undefined,
        stock: 0,
        weight: customForm.weight,
        status: 'active',
        primaryWarehouseId: customForm.primaryWarehouseId || undefined,
        colors: colors,
        imageFiles: imageFiles, // Ảnh chung từ máy tính
        stickerFiles: stickerFiles, // File stickers từ máy tính (sẽ upload lên Cloudinary)
        stickerUrls: stickerUrls.filter(url => url.trim() !== ''), // URLs trực tiếp từ internet
        // Gửi placedStickers chỉ với fields mà backend hỗ trợ
        stickers: placedStickers.length > 0 ? placedStickers.map((sticker, idx) => {
          // Sử dụng index làm ID đơn giản (1, 2, 3...)
          const simpleId = idx + 1
          
          console.log(`🔍 Sticker conversion [${idx}]: ID ${sticker.id} -> ${simpleId}, URL: ${sticker.src}`)
          
          const stickerObj = {
            id: simpleId,              // Luôn luôn là number đơn giản
            imageUrl: sticker.src,     // URL của sticker
            sortOrder: simpleId        // Cùng với ID để đơn giản
          }
          
          console.log(`🔍 Final sticker object [${idx}]:`, stickerObj)
          return stickerObj
        }) : []
      }
      
      console.log('🔍 [CustomProductModal] Payload chi tiết:')
      console.log('  - Tên sản phẩm:', payload.name)
      console.log('  - SKU:', payload.sku)
      console.log('  - Category:', payload.category)
      console.log('  - Price:', payload.price)
      console.log('  - Status:', payload.status)
      console.log('  - Colors:', payload.colors)
      console.log('  - File stickers (sẽ upload):', stickerFiles.length, 'files')
      console.log('  - URL stickers (trực tiếp):', stickerUrls.length, 'URLs:', stickerUrls)
      console.log('  - Placed stickers original:', placedStickers)
      console.log('  - Placed stickers converted:', payload.stickers)
      console.log('  - Image files:', imageFiles.length)
      console.log('  - Full payload:', payload)
      
      if (isEditMode && initialProduct) {
        // Update existing product
        const updated = await ProductService.updateProduct(initialProduct.id, payload)
        console.log('✅ Cập nhật sản phẩm thành công:', updated.id)
        onCreated(updated)
      } else {
        // Create new product
        const created = await ProductService.createProduct(payload)
        console.log('✅ Tạo sản phẩm mới thành công:', created.id)
        onCreated(created)
      }
      onClose()
    } catch (e: any) {
      console.error('❌ Lỗi khi lưu sản phẩm:', e)
      
      // Log chi tiết lỗi để debug
      if (e.response) {
        console.error('Response status:', e.response.status)
        console.error('Response data:', e.response.data)
        console.error('Response headers:', e.response.headers)
        
        // Hiển thị lỗi validation chi tiết
        if (e.response.status === 400 && e.response.data?.errors) {
          const validationErrors = Object.entries(e.response.data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('\n')
          setSaveError(`Lỗi validation:\n${validationErrors}`)
        } else if (e.response.data?.message) {
          setSaveError(`Lỗi: ${e.response.data.message}`)
        } else {
          setSaveError(`Lỗi HTTP ${e.response.status}: Không thể lưu sản phẩm`)
        }
      } else {
        setSaveError('Không thể kết nối đến server. Vui lòng thử lại.')
      }
    } finally {
      setIsSavingCustom(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditMode ? 'Chỉnh sửa hàng hóa tùy chỉnh' : 'Thêm hàng hóa tùy chỉnh'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12 10.59 13.4l-6.3 6.3 1.42 1.41L12 14.83l6.29 6.29 1.41-1.41-6.29-6.3 6.29-6.29z"/>
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form nhập liệu */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                  <input
                    value={customForm.name}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
                    <input
                      value={customForm.sku}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tự nhập hoặc bấm Tạo mã"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomForm(prev => ({ ...prev, sku: ProductService.generateSku(prev.category) }))}
                    className="h-10 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
                  >Tạo mã</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.filter(c => c.isCustomizable).map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (đ)</label>
                    <input
                      type="number"
                      value={customForm.price}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, price: Number(e.target.value || 0) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khối lượng (gram)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={customForm.weight}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, weight: Number(e.target.value || 500) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="500"
                    />
                  </div>
                </div>
                
                {/* Warehouse Selection */}
                {warehouses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kho lưu trữ</label>
                    <select
                      value={customForm.primaryWarehouseId}
                      onChange={(e) => setCustomForm(prev => ({ ...prev, primaryWarehouseId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Chọn kho lưu trữ (tùy chọn)</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Sản phẩm sẽ được lưu trữ tại kho đã chọn</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="image-upload" className="relative cursor-pointer">
                          <span className="font-medium text-indigo-600 hover:text-indigo-500">Kéo thả ảnh vào đây</span> hoặc <span className="font-medium text-indigo-600 hover:text-indigo-500">chọn từ máy</span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUploadImages}
                            className="sr-only"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Hỗ trợ nhiều ảnh, tối đa ~10 ảnh/ lần thêm</p>
                    </div>
                  </div>
                  {images.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-gray-500 mb-2">Ảnh đã upload</div>
                      <div className="flex flex-wrap gap-2">
                        {images.map((src, idx) => (
                          <div key={idx} className="relative">
                            <img src={src} alt={`img-${idx}`} className="w-16 h-16 object-cover border rounded" />
                            <button
                              type="button"
                              onClick={() => {
                                setImages(prev => prev.filter((_, i) => i !== idx))
                                setImageFiles(prev => prev.filter((_, i) => i !== idx))
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc sản phẩm</label>
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCustomForm(prev => ({ ...prev, selectedColor: color }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          customForm.selectedColor === color 
                            ? 'border-indigo-600 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <div className="flex items-center justify-center">
                      <input
                        type="color"
                        value={pendingColor}
                        onChange={(e) => setPendingColor(e.target.value)}
                        className="w-8 h-8 p-0 border border-gray-300 rounded-lg cursor-pointer"
                        title="Thêm màu mới"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addColor(pendingColor)}
                      className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                    >Thêm màu</button>
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(customForm.selectedColor)}
                        className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                      >Xóa màu đã chọn</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quản lý Sticker</label>
                  
                  {/* Add Sticker from URL */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 mb-3 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">Thêm từ Internet</h4>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={stickerUrl}
                        onChange={(e) => setStickerUrl(e.target.value)}
                        placeholder="https://example.com/sticker.png"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addStickerFromUrl}
                        disabled={!stickerUrl.trim() || isAddingStickerUrl}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
                      >
                        {isAddingStickerUrl ? (
                          <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang thêm...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Nhập URL ảnh sticker từ internet</p>
                  </div>

                  {/* Add Sticker from File */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thêm từ file máy tính</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleAddStickerFiles}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>

                  {/* Sticker Library */}
                  {stickerLibrary.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-3">
                        <div className="flex items-center justify-between">
                          <span>Thư viện sticker ({stickerLibrary.length}) - Click để thêm vào preview</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs">File máy</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-xs">URL Internet</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Cloudinary</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {(() => {
                            const fileCount = stickerLibrary.filter(src => src.startsWith('data:image/')).length
                            const urlCount = stickerLibrary.filter(src => stickerUrls.includes(src)).length
                            const cloudinaryCount = stickerLibrary.filter(src => src.includes('cloudinary.com')).length
                            
                            return (
                              <>
                                {fileCount > 0 && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {fileCount} từ file máy
                                  </span>
                                )}
                                {urlCount > 0 && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                    {urlCount} từ URL internet
                                  </span>
                                )}
                                {cloudinaryCount > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    {cloudinaryCount} đã lưu Cloudinary
                                  </span>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {stickerLibrary.map((src, idx) => {
                          const isFromUrl = stickerUrls.includes(src)
                          const isFromFile = src.startsWith('data:image/')
                          const isFromCloudinary = src.includes('cloudinary.com') && !isFromUrl && !isFromFile
                          
                          let borderColor = 'border-gray-200 hover:border-gray-300'
                          let indicatorColor = '#9ca3af'
                          let tooltipText = 'Không xác định nguồn'
                          
                          if (isFromFile) {
                            borderColor = 'border-blue-300 hover:border-blue-400'
                            indicatorColor = '#3b82f6'
                            tooltipText = 'Từ file máy tính'
                          } else if (isFromUrl) {
                            borderColor = 'border-purple-300 hover:border-purple-400'
                            indicatorColor = '#8b5cf6'
                            tooltipText = 'Từ URL internet'
                          } else if (isFromCloudinary) {
                            borderColor = 'border-green-300 hover:border-green-400'
                            indicatorColor = '#10b981'
                            tooltipText = 'Đã lưu trên Cloudinary'
                          }
                          
                          return (
                            <button 
                              key={idx} 
                              type="button" 
                              onClick={() => placeStickerFromLibrary(src)} 
                              className={`border rounded-lg p-2 hover:shadow-md transition-all duration-200 group relative ${borderColor}`}
                              title={tooltipText}
                            >
                              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded flex items-center justify-center">
                                <img 
                                  src={src} 
                                  alt={`sticker-${idx}`} 
                                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-200"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkwyOCAyMEwyMCAyOEwxMiAyMEwyMCAxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                                  }}
                                />
                              </div>
                              {/* Source indicator với màu động */}
                              <div className="absolute top-1 right-1">
                                <div 
                                  className="w-3 h-3 rounded-full shadow-sm border border-white" 
                                  style={{ backgroundColor: indicatorColor }}
                                  title={tooltipText}
                                ></div>
                              </div>
                              
                              {/* Thêm tooltip text khi hover */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                {tooltipText}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                  <textarea
                    value={customForm.description}
                    onChange={(e) => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mô tả ngắn về sản phẩm"
                  />
                </div>
                {saveError && (
                  <div className="text-sm text-red-600">{saveError}</div>
                )}
                <div className="pt-2 flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Đóng</button>
                  <button onClick={handleSaveCustomProduct} disabled={isSavingCustom} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">
                    {isSavingCustom ? 'Đang lưu...' : (isEditMode ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm')}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview sản phẩm */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-900">Xem trước</div>
                {placedStickers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPlacedStickers([])}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors duration-200"
                    title="Xóa tất cả stickers"
                  >
                    Xóa tất cả ({placedStickers.length})
                  </button>
                )}
              </div>
              <div
                ref={previewRef}
                className="relative w-full aspect-[3/4] rounded-lg border border-gray-200 overflow-hidden"
                style={{ backgroundColor: customForm.selectedColor }}
              >
                {/* Hiển thị ảnh chung */}
                {images.length > 0 ? (
                  <img src={images[0]} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">Tải ảnh sản phẩm để xem trước</div>
                )}
                {placedStickers.map(s => (
                  <div
                    key={s.id}
                    className="absolute cursor-move group"
                    style={{ left: s.x, top: s.y, transform: `scale(${s.scale})` }}
                    onMouseDown={(e) => onStickerMouseDown(e, s.id)}
                  >
                    <img src={s.src} alt="sticker" className="w-24 h-24 object-contain pointer-events-none select-none" />
                    
                    {/* Nút xóa sticker */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removePlacedSticker(s.id)
                      }}
                      className="absolute -right-1 -top-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      title="Xóa sticker"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                    
                    {/* Nút resize */}
                    <div
                      className="absolute -right-2 -bottom-2 w-5 h-5 bg-white border border-gray-300 rounded-full shadow cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => onResizeMouseDown(e, s.id)}
                      title="Kéo để thay đổi kích thước"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#6b7280"><path d="M3 21h18v-2H3v2zm0-7h13v-2H3v2zm0-7h8V5H3v2z"/></svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-base font-bold text-gray-900">{customForm.name || 'Tên sản phẩm'}</div>
                <div className="text-green-600 font-semibold">{customForm.price ? formatVnd(customForm.price) : '0'} đ</div>
                {customForm.description && (
                  <div className="text-gray-600 text-sm mt-2 line-clamp-3">{customForm.description}</div>
                )}
                {customForm.category && (
                  <div className="text-xs text-gray-500 mt-2">Danh mục: {customForm.category}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomProductModal


