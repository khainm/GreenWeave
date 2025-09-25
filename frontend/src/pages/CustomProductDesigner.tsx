import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import ProductService from '../services/productService'
import type { Product } from '../types/product'
import { 
  PaintBrushIcon, 
  PhotoIcon, 
  SparklesIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

// Import các component con
import ProductGallery from '../components/designer/ProductGallery'
import StickerPalette from '../components/designer/StickerPalette'
import ColorSelector from '../components/designer/ColorSelector'
import ActionButtons from '../components/designer/ActionButtons'
import ExportButtons from '../components/designer/ExportButtons'
import CanvasArea from '../components/designer/CanvasArea'

// Enhanced UI styles with improved design
const enhancedStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f9fafb;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f9fafb;
    border-radius: 8px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #d1d5db, #9ca3af);
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #9ca3af, #6b7280);
  }
  .scrollbar-thin::-webkit-scrollbar-corner {
    background: #f9fafb;
  }
  
  .glass-morphism {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  }
  
  .glass-morphism-dark {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .neo-morphism {
    background: #f0f0f0;
    box-shadow: 20px 20px 40px #d1d1d1, -20px -20px 40px #ffffff;
    border: none;
  }
  
  .neo-morphism-inset {
    background: #f0f0f0;
    box-shadow: inset 8px 8px 16px #d1d1d1, inset -8px -8px 16px #ffffff;
  }
  
  .gradient-bg-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  }
  
  .gradient-bg-secondary {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  
  .gradient-bg-accent {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
  
  .floating-animation {
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-5px) rotate(1deg); }
    50% { transform: translateY(-10px) rotate(0deg); }
    75% { transform: translateY(-5px) rotate(-1deg); }
  }
  
  .pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
      transform: scale(1.02);
    }
  }
  
  .shimmer {
    background: linear-gradient(110deg, #f0f0f0 8%, #e0e0e0 18%, #f0f0f0 33%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .click-effect {
    position: relative;
    overflow: hidden;
  }
  
  .click-effect::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  .click-effect:active::before {
    width: 300px;
    height: 300px;
  }
  
  .card-hover-effect {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .card-hover-effect:hover {
    transform: translateY(-12px) rotateX(5deg) rotateY(5deg);
    box-shadow: 
      0 32px 64px -12px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.05);
  }
  
  .text-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .border-gradient {
    position: relative;
    background: white;
    border-radius: 1rem;
  }
  
  .border-gradient::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
    border-radius: inherit;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .tooltip {
    position: relative;
  }
  
  .tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .tooltip:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }
`

type Sticker = {
  id: string
  src: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

const CustomProductDesigner: React.FC = () => {
  const canvasRef = useRef<{ stage: any; transformer: any } | null>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [productColor, setProductColor] = useState<string>('#ffffff')
  const [baseImageSrc, setBaseImageSrc] = useState<string>('')
  const [canvasSize, setCanvasSize] = useState<number>(600)
  const [showToolsMobile, setShowToolsMobile] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'products' | 'stickers' | 'colors' | 'tools'>('products')

  // Keep selection state in Konva Transformer via effect below

  const addSticker = (src: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    // Đặt sticker ở trung tâm canvas với kích thước rất nhỏ
    const centerX = canvasSize / 2 - 10 // Offset rất nhỏ để căn giữa
    const centerY = canvasSize / 2 - 10
    setStickers(prev => [...prev, { 
      id, 
      src, 
      x: centerX, 
      y: centerY, 
      scaleX: 0.15,  // Giảm xuống 0.15 để sticker rất nhỏ
      scaleY: 0.15,  // Giảm xuống 0.15 để sticker rất nhỏ
      rotation: 0 
    }])
    setSelectedId(id)
    
    // Visual feedback
    const button = document.activeElement as HTMLElement
    if (button) {
      button.style.transform = 'scale(0.95)'
      setTimeout(() => {
        button.style.transform = ''
      }, 150)
    }
  }

  const onSelect = (id: string) => {
    setSelectedId(id)
    // Add visual feedback for selection
    const canvasContainer = canvasWrapRef.current
    if (canvasContainer) {
      canvasContainer.style.transform = 'scale(1.01)'
      setTimeout(() => {
        canvasContainer.style.transform = ''
      }, 200)
    }
  }
  
  const clearSelection = () => {
    setSelectedId(null)
  }

  const removeSelected = () => {
    if (!selectedId) return
    setStickers(prev => prev.filter(s => s.id !== selectedId))
    setSelectedId(null)
    
    // Visual feedback for deletion
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse'
    toast.textContent = 'Đã xóa sticker'
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.remove()
    }, 2000)
  }

  const resetDesign = () => {
    setStickers([])
    setSelectedId(null)
  }

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }


  const exportPNG = () => {
    const uri = canvasRef.current?.stage?.toDataURL({ pixelRatio: 2 })
    if (!uri) return
    const a = document.createElement('a')
    a.href = uri
    a.download = 'design.png'
    a.click()
  }

  const exportJSON = () => {
    const json = JSON.stringify({ baseImageSrc, productColor, stickers }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'design.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  React.useEffect(() => {
    const tr = canvasRef.current?.transformer
    const stage = canvasRef.current?.stage
    if (!tr || !stage) return
    if (!selectedId) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
      return
    }
    const node = stage.findOne(`.${selectedId}`)
    if (node) {
      tr.nodes([node])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedId, stickers])

  // Responsive canvas: observe wrapper width and make canvas larger
  React.useEffect(() => {
    const el = canvasWrapRef.current
    if (!el) return
    const ro = new (window as any).ResizeObserver((entries: any[]) => {
      const entry = entries[0]
      const width = entry.contentRect?.width || el.clientWidth
      const height = entry.contentRect?.height || el.clientHeight
      
      // Tính toán kích thước canvas tối ưu dựa trên container
      const minDimension = Math.min(width, height)
      const size = Math.max(400, Math.min(800, Math.floor(minDimension * 0.7)))
      setCanvasSize(size)
    })
    ro.observe(el)
    // initial measure
    const width = el.clientWidth
    const height = el.clientHeight
    const minDimension = Math.min(width, height)
    setCanvasSize(Math.max(400, Math.min(800, Math.floor(minDimension * 0.7))))
    return () => ro.disconnect()
  }, [])

  // Load customizable products
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const list = await ProductService.getCustomizableProducts()
        setProducts(list)
        // Auto-select the first product that has an image (primary/any)
        if (list && list.length > 0) {
          const withImage = list.find(p => (p.images && p.images.length > 0)) || list[0]
          setSelectedProduct(withImage)
        }
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      
      // Delete selected sticker
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault()
          removeSelected()
        }
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])

  // Auto-save design to localStorage
  useEffect(() => {
    if (stickers.length > 0 || baseImageSrc) {
      const designData = {
        baseImageSrc,
        productColor,
        stickers,
        selectedProductId: selectedProduct?.id,
        timestamp: Date.now()
      }
      localStorage.setItem('greenweave_design_draft', JSON.stringify(designData))
    }
  }, [stickers, baseImageSrc, productColor, selectedProduct])

  // Load draft on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem('greenweave_design_draft')
        if (draft) {
          const data = JSON.parse(draft)
          // Only load if it's recent (less than 24 hours old)
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            // Show notification that draft was loaded
            console.log('Đã tải bản nháp thiết kế')
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
    loadDraft()
  }, [])

  // Helper: find image for a given color from product images
  const getImageForColor = (p: Product | null, color?: string) => {
    if (!p) return ''
    
    // Nếu có colorCode mapping, dùng nó
    if (color) {
      const img = p.images.find(i => i.colorCode?.toLowerCase() === color.toLowerCase())
      if (img) return img.imageUrl
      
      // Nếu không có colorCode, map theo thứ tự: màu 1 → ảnh 1, màu 2 → ảnh 2
      const colorIndex = p.colors?.findIndex(c => c.colorCode?.toLowerCase() === color.toLowerCase())
      if (colorIndex !== undefined && colorIndex >= 0 && p.images[colorIndex]) {
        return p.images[colorIndex].imageUrl
      }
    }
    
    // Fallback: ảnh chính hoặc ảnh đầu tiên
    const primary = p.images.find(i => i.isPrimary) || p.images[0]
    return primary?.imageUrl || ''
  }

  // When select product, set default image and default color
  useEffect(() => {
    if (!selectedProduct) return
    const firstColor = selectedProduct?.colors?.[0]?.colorCode
    if (firstColor) {
      setProductColor(firstColor)
      setBaseImageSrc(getImageForColor(selectedProduct, firstColor))
    } else {
      setBaseImageSrc(getImageForColor(selectedProduct))
    }
    setStickers([])
    setSelectedId(null)
  }, [selectedProduct])

  // When change color, update base image from backend data
  useEffect(() => {
    if (!selectedProduct) return
    setBaseImageSrc(getImageForColor(selectedProduct, productColor))
  }, [productColor])

  // Upload sticker bị vô hiệu hóa theo yêu cầu (chỉ dùng sticker của admin)

  if (isLoading) {
    return (
      <>
        <style>{enhancedStyles}</style>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Đang tải Studio Thiết Kế...</h2>
            <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{enhancedStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Studio Thiết Kế
              </h1>
            </div>
            <p className="text-gray-600 text-base max-w-xl mx-auto">
              Tạo ra những sản phẩm độc đáo với thiết kế của riêng bạn
            </p>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden mb-4">
            <div className="bg-white rounded-xl shadow-md p-1">
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'products', label: 'Sản phẩm', icon: PhotoIcon },
                  { id: 'stickers', label: 'Stickers', icon: SparklesIcon },
                  { id: 'colors', label: 'Màu sắc', icon: PaintBrushIcon },
                  { id: 'tools', label: 'Công cụ', icon: Bars3Icon }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Sidebar - Tools */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                <StickerPalette 
                  selectedProduct={selectedProduct}
                  onAddSticker={addSticker}
                />

                <ColorSelector 
                  selectedProduct={selectedProduct}
                  productColor={productColor}
                  onColorChange={setProductColor}
                />

                <ActionButtons 
                  selectedId={selectedId}
                  onRemoveSelected={removeSelected}
                  onResetDesign={resetDesign}
                />

                <ExportButtons 
                  onExportPNG={exportPNG}
                  onExportJSON={exportJSON}
                />
              </div>
            </div>

            {/* Mobile Tab Content */}
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                {activeTab === 'products' && (
                  <ProductGallery 
                    products={products}
                    selectedProduct={selectedProduct}
                    onSelectProduct={setSelectedProduct}
                  />
                )}
                {activeTab === 'stickers' && (
                  <StickerPalette 
                    selectedProduct={selectedProduct}
                    onAddSticker={addSticker}
                  />
                )}
                {activeTab === 'colors' && (
                  <ColorSelector 
                    selectedProduct={selectedProduct}
                    productColor={productColor}
                    onColorChange={setProductColor}
                  />
                )}
                {activeTab === 'tools' && (
                  <div className="space-y-3">
                    <ActionButtons 
                      selectedId={selectedId}
                      onRemoveSelected={removeSelected}
                      onResetDesign={resetDesign}
                    />
                    <ExportButtons 
                      onExportPNG={exportPNG}
                      onExportJSON={exportJSON}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Area - Center */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl shadow-md p-4">
                {/* Canvas Container */}
                <div className="bg-white rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center relative" ref={canvasWrapRef}>
                  {/* Canvas Area */}
                  <div className="w-full h-full">
                    <CanvasArea 
                      ref={canvasRef}
                      canvasSize={canvasSize}
                      baseImageSrc={baseImageSrc}
                      stickers={stickers}
                      selectedId={selectedId}
                      onClearSelection={clearSelection}
                      onSelectSticker={onSelect}
                      onUpdateSticker={updateSticker}
                      onRemoveSelected={removeSelected}
                    />
                  </div>
                  
                  {/* Canvas Info Overlay */}
                  {!baseImageSrc && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Chọn sản phẩm để bắt đầu</h3>
                        <p className="text-gray-400">Chọn một sản phẩm từ danh sách để bắt đầu thiết kế</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Products */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-4">
                <ProductGallery 
                  products={products}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CustomProductDesigner


