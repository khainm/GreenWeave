import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva'
import useImage from 'use-image'
import ProductService from '../services/productService'
import type { Product } from '../types/product'

type Sticker = {
  id: string
  src: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

// No default stickers; users can upload their own

const KonvaImageNode: React.FC<{ name?: string; src: string; x?: number; y?: number; scaleX?: number; scaleY?: number; rotation?: number; draggable?: boolean; onClick?: () => void; onDragEnd?: (pos: { x: number; y: number }) => void; onTransformEnd?: (attrs: { scaleX: number; scaleY: number; rotation: number }) => void }>
  = ({ name, src, x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, draggable, onClick, onDragEnd, onTransformEnd }) => {
  const [image] = useImage(src, 'anonymous')
  const shapeRef = useRef<any>(null)

  return (
    <KonvaImage
      name={name}
      ref={shapeRef}
      image={image as any}
      x={x}
      y={y}
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={rotation}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => onDragEnd?.({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target
        const newScaleX = node.scaleX()
        const newScaleY = node.scaleY()
        const newRotation = node.rotation()
        onTransformEnd?.({ scaleX: newScaleX, scaleY: newScaleY, rotation: newRotation })
      }}
    />
  )
}

// Base image that scales to fit and centers in the canvas
const FitImageNode: React.FC<{ src: string; target: number }>
  = ({ src, target }) => {
  const [image] = useImage(src, 'anonymous')
  const [computed, setComputed] = React.useState({ x: 0, y: 0, scale: 1 })

  React.useEffect(() => {
    if (!image) return
    const iw = (image as any).width || 1
    const ih = (image as any).height || 1
    const ratio = Math.min(target / iw, target / ih)
    const w = iw * ratio
    const h = ih * ratio
    const x = (target - w) / 2
    const y = (target - h) / 2
    setComputed({ x, y, scale: ratio })
  }, [image, target])

  return (
    <KonvaImage
      image={image as any}
      x={computed.x}
      y={computed.y}
      scaleX={computed.scale}
      scaleY={computed.scale}
      listening={false}
    />
  )
}

const CustomProductDesigner: React.FC = () => {
  const stageRef = useRef<any>(null)
  const trRef = useRef<any>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [productColor, setProductColor] = useState<string>('#ffffff')
  const [baseImageSrc, setBaseImageSrc] = useState<string>('')
  const [canvasSize, setCanvasSize] = useState<number>(480)
  const [showToolsMobile, setShowToolsMobile] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Keep selection state in Konva Transformer via effect below

  const addSticker = (src: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setStickers(prev => [...prev, { id, src, x: 60, y: 60, scaleX: 1, scaleY: 1, rotation: 0 }])
    setSelectedId(id)
  }

  const onSelect = (id: string) => setSelectedId(id)
  const clearSelection = () => setSelectedId(null)

  const removeSelected = () => {
    if (!selectedId) return
    setStickers(prev => prev.filter(s => s.id !== selectedId))
    setSelectedId(null)
  }

  const resetDesign = () => {
    setStickers([])
    setSelectedId(null)
  }

  const exportPNG = () => {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 })
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
    const tr = trRef.current
    const stage = stageRef.current
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

  // Responsive canvas: observe wrapper width
  React.useEffect(() => {
    const el = canvasWrapRef.current
    if (!el) return
    const ro = new (window as any).ResizeObserver((entries: any[]) => {
      const entry = entries[0]
      const width = entry.contentRect?.width || el.clientWidth
      const size = Math.max(280, Math.min(800, Math.floor(width)))
      setCanvasSize(size)
    })
    ro.observe(el)
    // initial measure
    const width = el.clientWidth
    setCanvasSize(Math.max(280, Math.min(800, Math.floor(width))))
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Mobile tools toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900">Trình thiết kế</div>
          <button
            onClick={() => setShowToolsMobile(v => !v)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >{showToolsMobile ? 'Ẩn công cụ' : 'Hiện công cụ'}</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Sidebar tools */}
          {(showToolsMobile || typeof window === 'undefined' || window.innerWidth >= 1024) && (
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4 space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Sản phẩm sẽ được chọn ở phần gallery bên phải */}
            {/* Ảnh gốc được nạp theo dữ liệu đã lưu của admin (theo màu) */}
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Màu sản phẩm</div>
              <div className="flex flex-wrap gap-2">
                {(selectedProduct?.colors?.map(c => c.colorCode) || ['#ffffff','#000000']).map(c => (
                  <button key={c} onClick={() => setProductColor(c!)} className={`w-8 h-8 rounded-full border ${productColor===c?'border-green-600':'border-gray-300'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            {/* Không cho user upload sticker, chỉ sử dụng sticker do admin chuẩn bị */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={removeSelected} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">Xóa sticker</button>
              <button onClick={resetDesign} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">Làm mới</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={exportPNG} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">Xuất PNG</button>
              <button onClick={exportJSON} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Lưu JSON</button>
            </div>
          </div>
          )}

          {/* Canvas area */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
            {/* Gallery sản phẩm tùy chỉnh */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">Sản phẩm tùy chỉnh</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {products?.map(p => {
                  const thumb = p?.images?.find(i => i.isPrimary)?.imageUrl || p?.images?.[0]?.imageUrl
                  const active = selectedProduct?.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`min-w-[130px] border rounded-lg overflow-hidden text-left hover:shadow transition-shadow ${active ? 'border-green-600' : 'border-gray-200'}`}
                      title={p.name}
                    >
                      {thumb && <img src={thumb} className="w-full h-24 object-cover" alt={p.name} />}
                      <div className="p-2">
                        <div className="text-xs font-semibold line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Sticker palette từ admin */}
            {selectedProduct?.stickers && selectedProduct.stickers.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Sticker đã được chuẩn bị</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct?.stickers?.sort((a,b)=>a.sortOrder-b.sortOrder).map(s => (
                    <button key={s.id} onClick={() => addSticker(s.imageUrl)} className="border rounded-lg p-1 hover:shadow">
                      <img src={s.imageUrl} className="w-12 h-12 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm font-semibold text-gray-900 mb-3">Canvas thiết kế</div>
            <div className="w-full" ref={canvasWrapRef}>
              <div className="mx-auto" style={{ width: '100%', maxWidth: 720 }}>
                <Stage
                  ref={stageRef}
                  width={canvasSize}
                  height={canvasSize}
                  onMouseDown={(e) => { if (e.target === e.target.getStage()) clearSelection() }}
                >
                  <Layer>
                    {/* Background color overlay */}
                    <Rect width={canvasSize} height={canvasSize} fill={productColor} />
                    {baseImageSrc && (
                      <FitImageNode src={baseImageSrc} target={canvasSize} />
                    )}
                    {stickers.map(s => (
                      <KonvaImageNode
                        key={s.id}
                        name={s.id}
                        src={s.src}
                        x={s.x}
                        y={s.y}
                        scaleX={s.scaleX}
                        scaleY={s.scaleY}
                        rotation={s.rotation}
                        draggable
                        onClick={() => onSelect(s.id)}
                        onDragEnd={({ x, y }) => setStickers(prev => prev.map(p => p.id === s.id ? { ...p, x, y } : p))}
                        onTransformEnd={({ scaleX, scaleY, rotation }) => setStickers(prev => prev.map(p => p.id === s.id ? { ...p, scaleX, scaleY, rotation } : p))}
                      />
                    ))}
                    <Transformer
                      ref={trRef}
                      rotateEnabled
                      enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]}
                      rotateAnchorOffset={30}
                      padding={5}
                    />
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomProductDesigner


