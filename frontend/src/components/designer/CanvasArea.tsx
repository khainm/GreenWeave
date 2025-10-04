import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { PhotoIcon } from '@heroicons/react/24/outline';
import useImage from 'use-image';
import type { ProductResponseDto, DesignElement, CustomDesign } from './types';

interface CanvasAreaProps {
  selectedProduct: ProductResponseDto | null;
  selectedColorCode?: string;
  design: CustomDesign | null;
  onDesignChange: (design: CustomDesign) => void;
}

// Component để hiển thị ảnh trong Konva
const CanvasImage: React.FC<{
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}> = ({ element, isSelected, onSelect, onChange }) => {
  const [image] = useImage(element.src || '');
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imageRef}
        {...element}
        image={image}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const CanvasArea: React.FC<CanvasAreaProps> = ({
  selectedProduct,
  selectedColorCode,
  design,
  onDesignChange,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const canvasWidth = 600;
  const canvasHeight = 400;

  // Lấy ảnh sản phẩm theo màu được chọn
  const getProductImage = () => {
    if (!selectedProduct) return null;
    
    // Nếu có màu được chọn, tìm ảnh theo màu đó
    if (selectedColorCode) {
      // Tìm ảnh có colorCode khớp với màu được chọn
      const colorImage = selectedProduct.images.find(img => 
        img.colorCode && img.colorCode.toLowerCase() === selectedColorCode.toLowerCase()
      );
      
      if (colorImage) {
        return colorImage.imageUrl;
      }
      
      // Fallback: sử dụng colorImageMap nếu có
      if (selectedProduct.colorImageMap && selectedProduct.colorImageMap[selectedColorCode.toLowerCase()]) {
        return selectedProduct.colorImageMap[selectedColorCode.toLowerCase()];
      }
    }
    
    // Fallback: ảnh chính hoặc ảnh đầu tiên
    const primaryImage = selectedProduct.images?.find(img => img.isPrimary);
    if (primaryImage) {
      return primaryImage.imageUrl;
    }
    
    // Cuối cùng là ảnh đầu tiên nếu có
    return selectedProduct.images?.[0]?.imageUrl || null;
  };

  const [productImage] = useImage(getProductImage() || '');

  // Thêm element mới vào design
  const addElement = (element: Omit<DesignElement, 'id'>) => {
    if (!selectedProduct) return;

    const newElement: DesignElement = {
      ...element,
      id: `element_${Date.now()}`,
    };

    const newDesign: CustomDesign = design || {
      productId: selectedProduct.id,
      selectedColorCode,
      elements: [],
      canvasWidth,
      canvasHeight,
    };

    onDesignChange({
      ...newDesign,
      elements: [...newDesign.elements, newElement],
    });
  };

  // Cập nhật element
  const updateElement = (elementId: string, newAttrs: Partial<DesignElement>) => {
    if (!design) return;

    onDesignChange({
      ...design,
      elements: design.elements.map(el =>
        el.id === elementId ? { ...el, ...newAttrs } : el
      ),
    });
  };

  // Xóa element
  const deleteElement = (elementId: string) => {
    if (!design) return;

    onDesignChange({
      ...design,
      elements: design.elements.filter(el => el.id !== elementId),
    });
    setSelectedElementId(null);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId) {
        deleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElementId]);

  // Handle stage click to deselect
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null);
    }
  };

  // Export canvas as image
  const exportAsImage = () => {
    if (!stageRef.current) return;

    const dataURL = stageRef.current.toDataURL({
      mimeType: 'image/png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `custom-design-${selectedProduct?.name || 'product'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Expose methods to parent
  useEffect(() => {
    if (window.customDesigner) {
      window.customDesigner.addImage = (src: string) => {
        addElement({
          type: 'image',
          x: canvasWidth / 2 - 50,
          y: canvasHeight / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          src,
        });
      };

      window.customDesigner.exportImage = exportAsImage;
    }
  }, [selectedProduct, design]);

  if (!selectedProduct) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-gray-200 rounded-xl w-full max-w-3xl h-[500px] flex items-center justify-center border border-gray-300">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Chọn sản phẩm để bắt đầu</h3>
            <p className="text-sm">Chọn một sản phẩm từ danh sách để bắt đầu thiết kế</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-300 p-4">
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            {/* Product background image */}
            {productImage && (
              <KonvaImage
                image={productImage}
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                listening={false}
              />
            )}

            {/* Design elements */}
            {design?.elements.map((element) => (
              <CanvasImage
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onSelect={() => setSelectedElementId(element.id)}
                onChange={(newAttrs) => updateElement(element.id, newAttrs)}
              />
            ))}
          </Layer>
        </Stage>

        {/* Canvas info */}
        <div className="mt-2 text-center text-xs text-gray-500">
          {selectedProduct.name} - {canvasWidth} x {canvasHeight}px
          {selectedElementId && (
            <span className="ml-4 text-blue-600">
              Element được chọn (nhấn Delete để xóa)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Declare global interface for methods
declare global {
  interface Window {
    customDesigner: {
      addImage: (src: string) => void;
      exportImage: () => void;
    };
  }
}

export default CanvasArea;