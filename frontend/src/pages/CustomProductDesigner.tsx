import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/layout/Header'
import ProductService from '../services/productService'
import type { Product } from '../types/product'

// Import các component con
import ProductGallery from '../components/designer/ProductGallery'
import StickerPalette from '../components/designer/StickerPalette'
import ColorSelector from '../components/designer/ColorSelector'
import ActionButtons from '../components/designer/ActionButtons'
import ExportButtons from '../components/designer/ExportButtons'
import CanvasArea from '../components/designer/CanvasArea'
import ZoomControls from '../components/designer/ZoomControls'

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
  const [canvasSize, setCanvasSize] = useState<number>(800) // Tăng từ 600 lên 800 để ảnh to hơn
  const [zoom, setZoom] = useState<number>(1) // Thêm zoom state
  const [showToolsMobile, setShowToolsMobile] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Keep selection state in Konva Transformer via effect below

  const addSticker = (src: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    // Đặt sticker ở trung tâm canvas với kích thước lớn hơn (scale 1.5)
    const centerX = canvasSize / 2 - 60 // Offset để căn giữa
    const centerY = canvasSize / 2 - 60
    setStickers(prev => [...prev, { 
      id, 
      src, 
      x: centerX, 
      y: centerY, 
      scaleX: 1.5,  // Tăng từ 1 lên 1.5 để sticker lớn hơn
      scaleY: 1.5,  // Tăng từ 1 lên 1.5 để sticker lớn hơn
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

  // Function để fit canvas vào màn hình hiện tại một cách tối ưu
  const fitToScreen = () => {
    const canvasContainer = canvasWrapRef.current
    if (!canvasContainer) return
    
    const containerWidth = canvasContainer.clientWidth - 100 // Trừ padding
    const containerHeight = canvasContainer.clientHeight - 100 // Trừ padding
    
    // Tính zoom để canvas vừa với container
    const scaleX = containerWidth / canvasSize
    const scaleY = containerHeight / canvasSize
    const optimalZoom = Math.min(scaleX, scaleY, 1.5) // Không vượt quá 150%
    
    setZoom(Math.max(0.5, optimalZoom)) // Không dưới 50%
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
      // Tăng canvas size để ảnh to và rõ hơn: min 500px, max 1200px
      const size = Math.max(500, Math.min(1200, Math.floor(width * 0.8)))
      setCanvasSize(size)
    })
    ro.observe(el)
    // initial measure - đặt size lớn hơn để ảnh hiển thị to
    const width = el.clientWidth
    setCanvasSize(Math.max(500, Math.min(1200, Math.floor(width * 0.8))))
    return () => ro.disconnect()
  }, [])

  // Load customizable products
  useEffect(() => {
    const load = async () => {
      try {
        const list = await ProductService.getCustomizableProducts()
        setProducts(list)
        // Auto-select the first product that has an image (primary/any)
        if (list && list.length > 0) {
          const withImage = list.find(p => (p.images && p.images.length > 0)) || list[0]
          setSelectedProduct(withImage)
        }
      } catch {}
    }
    load()
  }, [])

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            setZoom(prev => Math.min(prev + 0.2, 2.0))
            break
          case '-':
            e.preventDefault()
            setZoom(prev => Math.max(prev - 0.2, 0.5))
            break
          case '0':
            e.preventDefault()
            setZoom(1)
            break
        }
      }
      
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

  return (
    <>
      <style>{enhancedStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Enhanced background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl floating-animation"></div>
          <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/25 to-cyan-400/25 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl floating-animation" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-amber-300/15 to-orange-300/15 rounded-full blur-3xl floating-animation" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Header Section */}
        {/* Compact Header Section */}
        <div className="mb-8 text-center relative z-10">
          <div className="inline-block mb-4">
            <div className="relative">
              <h1 className="text-3xl lg:text-4xl font-black text-gradient bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 tracking-tight">
                Studio Thiết Kế
              </h1>
            </div>
          </div>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Tạo ra những sản phẩm độc đáo với thiết kế của riêng bạn
          </p>
        </div>        {/* Enhanced Mobile tools toggle */}
        <div className="lg:hidden mb-6 relative z-10">
          <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-bg-accent rounded-xl flex items-center justify-center shadow-lg pulse-glow">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">Công cụ thiết kế</div>
                  <div className="text-xs text-gray-600">Tùy chỉnh sản phẩm của bạn</div>
                </div>
              </div>
              <button
                onClick={() => setShowToolsMobile(v => !v)}
                className="px-6 py-3 rounded-xl gradient-bg-primary text-white text-sm font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 click-effect relative overflow-hidden"
              >
                <span className="relative z-10">
                  {showToolsMobile ? 'Ẩn công cụ' : 'Hiện công cụ'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-120px)]">
          {/* Compact Left Sidebar - chiếm 2/12 cột */}
          {(showToolsMobile || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <div className="lg:col-span-2 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin relative z-10">
              <div className="space-y-4 pb-6">
                <ProductGallery 
                  products={products}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                />

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
          )}

          {/* Expanded Canvas Area - chiếm 10/12 cột */}
          <div className="lg:col-span-10 glass-morphism rounded-3xl shadow-2xl border border-white/30 p-4 card-hover-effect relative z-10 flex flex-col">
            {/* Enhanced Canvas Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-bg-secondary rounded-xl flex items-center justify-center shadow-lg pulse-glow">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gradient">Canvas thiết kế</h3>
                    <p className="text-gray-600 text-sm font-medium">Kéo thả và tùy chỉnh stickers của bạn</p>
                  </div>
                </div>
                
                {/* Zoom Controls */}
                <ZoomControls 
                  zoom={zoom}
                  onZoomIn={() => setZoom(prev => Math.min(prev + 0.2, 2.0))}
                  onZoomOut={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                  onResetZoom={() => setZoom(1)}
                  onFitToScreen={fitToScreen}
                />
              </div>
              
              <div className="flex-1 flex items-center justify-center" ref={canvasWrapRef}>
                <CanvasArea 
                  ref={canvasRef}
                  canvasSize={canvasSize}
                  zoom={zoom}
                  baseImageSrc={baseImageSrc}
                  stickers={stickers}
                  selectedId={selectedId}
                  onClearSelection={clearSelection}
                  onSelectSticker={onSelect}
                  onUpdateSticker={updateSticker}
                  onRemoveSelected={removeSelected}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export default CustomProductDesigner


