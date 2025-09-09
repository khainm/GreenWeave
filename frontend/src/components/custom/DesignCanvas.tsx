import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Circle, Image as KonvaImage } from 'react-konva'

interface DesignNode {
  id: string
  type: 'icon' | 'text'
  x: number
  y: number
  content: string
  fontSize?: number
  color?: string
  scale?: number
}

interface DesignCanvasProps {
  designNodes: DesignNode[]
  onStageClick: (e: any) => void
  onNodeDragEnd: (nodeId: string, newPos: { x: number; y: number }) => void
  onNodeDelete: (nodeId: string) => void
  productImage?: HTMLImageElement | null
  printArea?: { x: number; y: number; width: number; height: number }
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({
  designNodes,
  onStageClick,
  onNodeDragEnd,
  onNodeDelete,
  productImage,
  printArea
}) => {
  const stageRef = useRef<any>(null)
  const [placeholderImage, setPlaceholderImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    // Create a simple placeholder image
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Background
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, 400, 500)
      
      // Border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, 400, 500)
      
      // Text
      ctx.fillStyle = '#6b7280'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Sản phẩm', 200, 200)
      ctx.fillText('Tùy biến', 200, 240)
      
      // Convert to image
      const img = new Image()
      img.onload = () => setPlaceholderImage(img)
      img.src = canvas.toDataURL()
    }
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Thiết kế của bạn</h3>
      <div className="relative">
        <Stage 
          width={800} 
          height={600} 
          ref={stageRef} 
          style={{ background: '#f9fafb' }}
          onClick={onStageClick}
        >
          <Layer>
            {/* Background */}
            <Rect x={0} y={0} width={800} height={600} fill="#fff" stroke="#e5e7eb" />
            
            {/* Product Image */}
            {(productImage || placeholderImage) && (
              <KonvaImage
                x={50}
                y={50}
                width={400}
                height={500}
                image={(productImage || placeholderImage)!}
              />
            )}
            
            {/* Print Area */}
            {printArea ? (
              <Rect 
                x={printArea.x + 50} 
                y={printArea.y + 50} 
                width={printArea.width} 
                height={printArea.height} 
                stroke="#10b981" 
                dash={[6, 6]} 
                fill="rgba(16, 185, 129, 0.1)"
              />
            ) : (
              // Default print area in center
              <Rect 
                x={150} 
                y={150} 
                width={200} 
                height={200} 
                stroke="#10b981" 
                dash={[6, 6]} 
                fill="rgba(16, 185, 129, 0.1)"
              />
            )}
            
            {/* Design Nodes */}
            {designNodes.map((node) => (
              <Group
                key={node.id}
                x={node.x}
                y={node.y}
                draggable
                onDragEnd={(e) => onNodeDragEnd(node.id, { x: e.target.x(), y: e.target.y() })}
              >
                <Circle
                  x={0}
                  y={0}
                  radius={25}
                  fill={node.color || '#10b981'}
                  stroke="#333"
                  strokeWidth={2}
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={5}
                  shadowOffset={{ x: 2, y: 2 }}
                />
                <Text
                  x={-10}
                  y={-10}
                  text={node.content}
                  fontSize={20}
                  fill="#fff"
                  fontStyle="bold"
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={2}
                />
                <Circle
                  x={20}
                  y={-20}
                  radius={10}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={3}
                  onClick={(e) => {
                    e.cancelBubble = true
                    onNodeDelete(node.id)
                  }}
                />
                <Text
                  x={15}
                  y={-25}
                  text="×"
                  fontSize={14}
                  fill="#fff"
                  fontStyle="bold"
                  onClick={(e) => {
                    e.cancelBubble = true
                    onNodeDelete(node.id)
                  }}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
        
        <div className="mt-4 text-sm text-gray-500 text-center space-y-1">
          <div>🎨 <strong>Hướng dẫn:</strong></div>
          <div>• Click vào vùng trống để thêm icon</div>
          <div>• Kéo thả icon để di chuyển</div>
          <div>• Click nút × đỏ để xóa icon</div>
          <div>• Vùng xanh đứt nét là khu vực in</div>
        </div>
      </div>
    </div>
  )
}

export default DesignCanvas
