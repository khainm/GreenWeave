import React, { useRef, useState } from 'react'
import Header from '../components/Header'
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva'
import useImage from 'use-image'

type Sticker = {
  id: string
  src: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

const defaultStickers = [
  'https://cdn-icons-png.flaticon.com/256/10559/10559698.png',
  'https://cdn-icons-png.flaticon.com/256/6702/6702470.png'
]

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

  const handleUploadBase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBaseImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUploadSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => addSticker(reader.result as string)
    reader.readAsDataURL(file)
  }

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
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Ảnh sản phẩm gốc</div>
              <input type="file" accept="image/*" onChange={handleUploadBase} className="text-sm" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Màu sản phẩm</div>
              <div className="flex flex-wrap gap-2">
                {['#ffffff','#000000','#e11d48','#10b981','#3b82f6','#f59e0b'].map(c => (
                  <button key={c} onClick={() => setProductColor(c)} className={`w-8 h-8 rounded-full border ${productColor===c?'border-green-600':'border-gray-300'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Thêm sticker</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {defaultStickers.map((s, i) => (
                  <button key={i} onClick={() => addSticker(s)} className="border rounded-lg p-1 hover:shadow">
                    <img src={s} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                  </button>
                ))}
              </div>
              <input type="file" accept="image/*" onChange={handleUploadSticker} className="text-sm" />
            </div>
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


