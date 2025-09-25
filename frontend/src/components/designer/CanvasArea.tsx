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
    <div className="relative w-full h-full">
      {/* Simple canvas container */}
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        {/* Canvas wrapper */}
        <div 
          className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          style={{ 
            width: canvasSize, 
            height: canvasSize,
            minWidth: 300,
            minHeight: 300
          }}
        >
          {/* Canvas */}
          <Stage
            ref={stageRef}
            width={canvasSize}
            height={canvasSize}
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
                anchorSize={8}
                anchorCornerRadius={4}
              />
            </Layer>
          </Stage>
        </div>
      </div>
      
      {/* Selected sticker controls */}
      {selectedId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={onRemoveSelected}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all duration-200 hover:shadow-md"
              title="Xóa sticker"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">Sticker đã chọn</span>
          </div>
        </div>
      )}
    </div>
  )
})

CanvasArea.displayName = 'CanvasArea'

export default CanvasArea
