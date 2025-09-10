import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/admin/TopNav'
import ProductService from '../services/productService'
import CategoryService from '../services/categoryService'
import type { Product } from '../types/product'

const formatVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

const AdminProductsList: React.FC = () => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sortKey, setSortKey] = useState<keyof Product>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { isCustomizable: boolean }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Customizable modal state
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customForm, setCustomForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: 0,
    description: '',
    selectedColor: '#ffffff' as string,
  })
  const [availableColors] = useState<string[]>(['#ffffff', '#000000', '#e11d48', '#10b981', '#3b82f6', '#f59e0b'])
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({})
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([])
  type PlacedSticker = { id: string; src: string; x: number; y: number; scale: number }
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([])
  const previewRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<null | { id: string; offsetX: number; offsetY: number; containerLeft: number; containerTop: number }>(null)
  const [resizeState, setResizeState] = useState<null | { id: string; startX: number; startY: number; startScale: number }>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(id)
  }, [query])

  // Auto generate SKU when category changes in custom form
  useEffect(() => {
    if (customForm.category) {
      setCustomForm(prev => ({ ...prev, sku: prev.sku || ProductService.generateSku(prev.category) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customForm.category])

  // Fetch products from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [prods, cats] = await Promise.all([
          ProductService.getAllProducts(),
          CategoryService.list().catch(() => [])
        ])
        setProducts(prods)
        const meta: Record<string, { isCustomizable: boolean }> = {}
        cats.forEach(c => { meta[c.name] = { isCustomizable: c.isCustomizable } })
        setCategoryMeta(meta)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Hàm xóa sản phẩm
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    
    try {
      await ProductService.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.')
    }
  }

  const filtered = products
    .filter(p =>
      (status === 'all' || p.status === status) &&
      (p.name.toLowerCase().includes(debounced.toLowerCase()) || p.sku.toLowerCase().includes(debounced.toLowerCase()))
    )
    .sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  // Handlers for Customizable modal
  const openCustomModal = () => {
    setShowCustomModal(true)
  }
  const closeCustomModal = () => {
    setShowCustomModal(false)
    setCustomForm({ name: '', sku: '', category: '', price: 0, description: '', selectedColor: '#ffffff' })
    setColorImageMap({})
    setStickerLibrary([])
    setPlacedStickers([])
    setDragState(null)
    setResizeState(null)
  }

  const handleUploadColorImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await ProductService.fileToBase64(file)
    const colorKey = customForm.selectedColor
    setColorImageMap(prev => ({ ...prev, [colorKey]: base64 }))
  }

  const handleAddStickerFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const base64s = await Promise.all(files.map(f => ProductService.fileToBase64(f)))
    setStickerLibrary(prev => [...prev, ...base64s])
  }

  const placeStickerFromLibrary = (src: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setPlacedStickers(prev => [...prev, { id, src, x: 40 + prev.length * 10, y: 40 + prev.length * 10, scale: 1 }])
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Danh sách hàng hóa</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Tìm theo tên hoặc SKU" 
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" 
                />
                <svg className="absolute left-3 top-3" width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M21 20l-5.2-5.2a7 7 0 10-1.4 1.4L20 21l1-1zM5 10a5 5 0 1110 0A5 5 0 015 10z"/>
                </svg>
              </div>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)} 
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors min-w-[160px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
              <Link 
                to="/admin/products/add" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Thêm hàng hóa
              </Link>
              <button
                type="button"
                onClick={openCustomModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                </svg>
                Thêm hàng hóa tùy chỉnh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr className="text-gray-600 text-sm font-medium">
                  {[
                    { key: 'sku', label: 'Mã' },
                    { key: 'name', label: 'Tên hàng hóa' },
                    { key: 'category', label: 'Danh mục' },
                    { key: 'stock', label: 'Tồn kho' },
                    { key: 'isCustomizable', label: 'Tuỳ chỉnh' },
                    { key: 'price', label: 'Giá bán' },
                  ].map((c) => (
                    <th 
                      key={c.key} 
                      className="py-4 px-6 cursor-pointer select-none hover:bg-gray-100 transition-colors" 
                      onClick={() => {
                        const k = c.key as keyof Product
                        if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                        else { setSortKey(k); setSortDir('asc') }
                      }}
                    >
                      <div className="flex items-center">
                        <span>{c.label}</span>
                        {sortKey === (c.key as keyof Product) && (
                          <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z" transform={sortDir === 'asc' ? 'rotate(180 12 12)' : ''} />
                          </svg>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500">Đang tải danh sách sản phẩm...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm nào'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-gray-700 font-medium">{p.sku}</td>
                      <td className="py-4 px-6 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-4 px-6 text-gray-600">{p.category}</td>
                      <td className="py-4 px-6 text-gray-700">{p.stock}</td>
                      <td className="py-4 px-6">
                        {categoryMeta[p.category]?.isCustomizable ? (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">Có</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">Không</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-bold">{formatVnd(p.price)} đ</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/admin/products/edit/${p.id}`}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Sửa
                          </Link>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeCustomModal} />
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Thêm hàng hóa tùy chỉnh</h3>
                <button onClick={closeCustomModal} className="p-2 rounded-lg hover:bg-gray-100">
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
                          {Object.entries(categoryMeta)
                            .filter(([, meta]) => meta.isCustomizable)
                            .map(([name]) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        {customForm.category && (
                          <div className="text-xs text-gray-500 mt-1">Tuỳ chỉnh: {categoryMeta[customForm.category]?.isCustomizable ? 'Có' : 'Không'}</div>
                        )}
                      </div>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setCustomForm(prev => ({ ...prev, selectedColor: color }))}
                              className={`relative w-8 h-8 rounded-full border-2 ${customForm.selectedColor === color ? 'border-indigo-600' : 'border-gray-200'}`}
                              style={{ backgroundColor: color }}
                              aria-label={`Chọn màu ${color}`}
                              title={color}
                            >
                              {colorImageMap[color] && (
                                <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">Mỗi màu có thể gắn 1 ảnh riêng. Chấm xanh = đã có ảnh.</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sticker (thêm từ file)</label>
                        <input type="file" accept="image/*" multiple onChange={handleAddStickerFiles} />
                        {stickerLibrary.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">Thư viện sticker (bấm để thêm vào preview)</div>
                            <div className="flex flex-wrap gap-2">
                              {stickerLibrary.map((src, idx) => (
                                <button key={idx} type="button" onClick={() => placeStickerFromLibrary(src)} className="border rounded-lg p-1 hover:shadow">
                                  <img src={src} alt={`sticker-${idx}`} className="w-12 h-12 object-contain" />
                                </button>
                              ))}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh cho màu đang chọn</label>
                        <input type="file" accept="image/*" onChange={handleUploadColorImage} />
                        {colorImageMap[customForm.selectedColor] && (
                          <div className="mt-2 flex items-center gap-3">
                            <img src={colorImageMap[customForm.selectedColor]} alt="color-preview" className="w-16 h-16 object-contain border rounded" />
                            <button
                              type="button"
                              onClick={() => setColorImageMap(prev => { const cp = { ...prev }; delete cp[customForm.selectedColor]; return cp })}
                              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                            >Xóa ảnh</button>
                          </div>
                        )}
                        {Object.keys(colorImageMap).length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">Ảnh theo màu đã gắn</div>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(colorImageMap).map(([color, src]) => (
                                <div key={color} className="flex items-center gap-2">
                                  <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                                  <img src={src} alt={color} className="w-10 h-10 object-contain border rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 flex gap-3">
                        <button onClick={closeCustomModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Đóng</button>
                        <button onClick={closeCustomModal} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Xong</button>
                      </div>
                    </div>
                  </div>

                  {/* Preview sản phẩm */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Xem trước</div>
                    <div
                      ref={previewRef}
                      className="relative w-full aspect-[3/4] rounded-lg border border-gray-200 overflow-hidden"
                      style={{ backgroundColor: customForm.selectedColor }}
                    >
                      {colorImageMap[customForm.selectedColor] ? (
                        <img src={colorImageMap[customForm.selectedColor]} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">Tải ảnh sản phẩm để xem trước</div>
                      )}
                      {placedStickers.map(s => (
                        <div
                          key={s.id}
                          className="absolute cursor-move"
                          style={{ left: s.x, top: s.y, transform: `scale(${s.scale})` }}
                          onMouseDown={(e) => onStickerMouseDown(e, s.id)}
                        >
                          <img src={s.src} alt="sticker" className="w-24 h-24 object-contain pointer-events-none select-none" />
                          {/* Resize handle */}
                          <div
                            className="absolute -right-2 -bottom-2 w-5 h-5 bg-white border border-gray-300 rounded-full shadow cursor-se-resize flex items-center justify-center"
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
        )}
      </div>
    </div>
  )
}

export default AdminProductsList


