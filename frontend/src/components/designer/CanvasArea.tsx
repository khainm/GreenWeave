import React, { forwardRef } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva'
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

// Component để hiển thị ảnh full size trong canvas với tỷ lệ tối ưu
const FullImageNode: React.FC<{ src: string; canvasSize: number }> = ({ src, canvasSize }) => {
  const [image] = useImage(src, 'anonymous')
  const [imageDimensions, setImageDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    if (image) {
      // Tính toán kích thước để ảnh vừa khít canvas nhưng vẫn giữ tỷ lệ
      const imgWidth = image.width
      const imgHeight = image.height
      const aspectRatio = imgWidth / imgHeight
      
      let displayWidth = canvasSize
      let displayHeight = canvasSize
      
      // Điều chỉnh để ảnh hiển thị full mà không bị cắt
      if (aspectRatio > 1) {
        // Ảnh ngang
        displayHeight = canvasSize / aspectRatio
      } else {
        // Ảnh dọc
        displayWidth = canvasSize * aspectRatio
      }
      
      setImageDimensions({ width: displayWidth, height: displayHeight })
    }
  }, [image, canvasSize])

  if (!image) return null

  return (
    <KonvaImage
      image={image as any}
      x={(canvasSize - imageDimensions.width) / 2} // Căn giữa
      y={(canvasSize - imageDimensions.height) / 2} // Căn giữa
      width={imageDimensions.width}
      height={imageDimensions.height}
      listening={false}
    />
  )
}

// Component để hiển thị sticker trong canvas
const KonvaImageNode: React.FC<{ 
  name?: string; 
  src: string; 
  x?: number; 
  y?: number; 
  scaleX?: number; 
  scaleY?: number; 
  rotation?: number; 
  draggable?: boolean; 
  onClick?: () => void; 
  onDragEnd?: (pos: { x: number; y: number }) => void; 
  onTransformEnd?: (attrs: { scaleX: number; scaleY: number; rotation: number }) => void 
}> = ({ name, src, x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, draggable, onClick, onDragEnd, onTransformEnd }) => {
  const [image] = useImage(src, 'anonymous')

  return (
    <KonvaImage
      name={name}
      image={image as any}
      x={x}
      y={y}
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={rotation}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={(e) => onDragEnd?.({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target
        onTransformEnd?.({
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation()
        })
      }}
    />
  )
}

interface CanvasAreaProps {
  canvasSize: number
  zoom: number
  baseImageSrc: string
  stickers: Sticker[]
  selectedId: string | null
  onClearSelection: () => void
  onSelectSticker: (id: string) => void
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void
  onRemoveSelected: () => void
}

const CanvasArea = forwardRef<{ stage: any; transformer: any }, CanvasAreaProps>(({
  canvasSize,
  zoom,
  baseImageSrc,
  stickers,
  selectedId,
  onClearSelection,
  onSelectSticker,
  onUpdateSticker,
  onRemoveSelected
}, ref) => {
  const stageRef = React.useRef<any>(null)
  const trRef = React.useRef<any>(null)

  // Expose refs to parent component
  React.useImperativeHandle(ref, () => ({
    stage: stageRef.current,
    transformer: trRef.current,
  }))

  // Update transformer when selection changes
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

  return (
    <div className="relative h-full">
      {/* Canvas container với responsive design */}
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/50 to-purple-50/50 rounded-3xl p-6 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 h-full">
        {/* Header với thông tin canvas */}
        <div className="flex items-center justify-between mb-4 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/60">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">Canvas thiết kế</span>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {Math.round(canvasSize * zoom)}×{Math.round(canvasSize * zoom)}px
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Stickers: <span className="font-bold text-purple-600">{stickers.length}</span>
          </div>
        </div>

        {/* Main canvas area với improved scroll và fit-to-content */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 relative h-[calc(100%-80px)] flex items-center justify-center overflow-hidden">
          {/* Canvas scroll container */}
          <div className="w-full h-full overflow-auto scrollbar-thin relative bg-gray-50">
            {/* Empty state */}
            {!baseImageSrc && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center text-gray-400">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium mb-1">Chọn sản phẩm để bắt đầu</p>
                  <p className="text-xs text-gray-400">Thiết kế của bạn sẽ xuất hiện ở đây</p>
                </div>
              </div>
            )}
            
            {/* Canvas wrapper với dynamic sizing để ảnh hiển thị to nhất có thể */}
            <div className="flex items-center justify-center min-h-full p-6">
              <div 
                className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                style={{ 
                  width: canvasSize * zoom, 
                  height: canvasSize * zoom,
                  minWidth: 400,
                  minHeight: 400
                }}
              >
                {/* Canvas với kích thước tối ưu */}
                <Stage
                  ref={stageRef}
                  width={canvasSize}
                  height={canvasSize}
                  scaleX={zoom}
                  scaleY={zoom}
                  onMouseDown={(e) => { if (e.target === e.target.getStage()) onClearSelection() }}
                >
                  <Layer>
                    {baseImageSrc && (
                      <FullImageNode src={baseImageSrc} canvasSize={canvasSize} />
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
                        onClick={() => onSelectSticker(s.id)}
                        onDragEnd={({ x, y }) => onUpdateSticker(s.id, { x, y })}
                        onTransformEnd={({ scaleX, scaleY, rotation }) => onUpdateSticker(s.id, { scaleX, scaleY, rotation })}
                      />
                    ))}
                    <Transformer
                      ref={trRef}
                      rotateEnabled
                      enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]}
                      rotateAnchorOffset={30}
                      padding={5}
                      borderStroke="#3b82f6"
                      borderStrokeWidth={2}
                      anchorStroke="#3b82f6"
                      anchorFill="#ffffff"
                      anchorSize={10}
                      anchorCornerRadius={5}
                    />
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {selectedId && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 glass-morphism rounded-2xl shadow-2xl border border-white/40 p-4 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onRemoveSelected}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-110"
              title="Xóa sticker"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div className="text-xs font-medium text-gray-600 px-3 py-1">
              Sticker đã chọn
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

CanvasArea.displayName = 'CanvasArea'

export default CanvasArea
