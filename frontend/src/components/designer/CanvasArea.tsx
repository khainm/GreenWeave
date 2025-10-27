import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Group, Rect } from 'react-konva';
import { PhotoIcon } from '@heroicons/react/24/outline';
import useImage from 'use-image';
import type { ProductResponseDto, DesignElement, CustomDesign } from './types';

interface CanvasAreaProps {
  selectedProduct: ProductResponseDto | null;
  selectedColorCode?: string;
  design: CustomDesign | null;
  onDesignChange: (design: CustomDesign) => void;
  onTextElementSelect?: (elementId: string | null) => void;
}

// Component để hiển thị ảnh trong Konva
const CanvasImage: React.FC<{
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}> = ({ element, isSelected, onSelect, onChange }) => {
  const [image] = useImage(element.src || '', 'anonymous');
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

// Helper function to calculate curved text positions
const calculateCurvedTextPositions = (
  text: string,
  fontSize: number,
  curveAmount: number,
  letterSpacing: number
) => {
  const chars = text.split('');
  const charWidth = fontSize * 0.6 + letterSpacing;
  const totalWidth = chars.length * charWidth;
  
  // Calculate radius based on curve amount and text width
  // Higher curve amount = smaller radius (more curve)
  const baseRadius = totalWidth / 2;
  const curveFactor = Math.abs(curveAmount) / 50; // Normalize to 0-2 range
  const radius = baseRadius / Math.max(0.3, curveFactor); // Prevent too small radius
  
  const positions: { char: string; x: number; y: number; rotation: number }[] = [];

  chars.forEach((char, i) => {
    const xOffset = i * charWidth - totalWidth / 2 + charWidth / 2;
    
    if (curveAmount === 0) {
      // Straight text
      positions.push({
        char,
        x: xOffset,
        y: 0,
        rotation: 0
      });
    } else {
      // Curved text - arc calculation
      const angle = xOffset / radius;
      const x = radius * Math.sin(angle);
      
      // Fixed: Curve direction
      // Positive curveAmount (>0) = Curve UP (smile ⌃)
      // Negative curveAmount (<0) = Curve DOWN (frown ⌄)
      const y = curveAmount > 0 
        ? -radius * Math.cos(angle) + radius  // Curve up: arc on top
        : -radius * Math.cos(angle) - radius; // Curve down: arc on bottom (flip)
      
      positions.push({
        char,
        x,
        y,
        rotation: (angle * 180) / Math.PI
      });
    }
  });

  return positions;
};

// Component để hiển thị text trong Konva với khả năng edit trực tiếp
const CanvasText: React.FC<{
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}> = ({ element, isSelected, onSelect, onChange }) => {
  const textRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Double click to edit text
  const handleDoubleClick = () => {
    setIsEditing(true);
    const textNode = textRef.current;
    const stage = textNode.getStage();
    const layer = textNode.getLayer();

    // Hide text node
    textNode.hide();

    // Create textarea for editing
    const textPosition = textNode.getClientRect();
    const stageBox = stage.container().getBoundingClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = element.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${textPosition.width}px`;
    textarea.style.height = `${textPosition.height}px`;
    textarea.style.fontSize = `${(element.fontSize || 32) * textNode.scaleX()}px`;
    textarea.style.fontFamily = element.fontFamily || 'Arial';
    textarea.style.color = element.fill || '#000000';
    textarea.style.fontWeight = element.fontWeight || 'normal';
    textarea.style.fontStyle = element.fontStyle || 'normal';
    textarea.style.textAlign = element.align || 'left';
    textarea.style.border = '2px solid #4F46E5';
    textarea.style.padding = '4px';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'rgba(255, 255, 255, 0.95)';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.2';
    textarea.style.transformOrigin = 'left top';
    textarea.style.zIndex = '9999';
    textarea.style.borderRadius = '4px';
    textarea.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
      window.removeEventListener('click', handleOutsideClick);
      textNode.show();
      layer.batchDraw();
      setIsEditing(false);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        // Update text with new value
        const newText = textarea.value;
        if (newText !== element.text) {
          onChange({
            ...element,
            text: newText
          });
        }
        removeTextarea();
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        removeTextarea();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        const newText = textarea.value;
        if (newText !== element.text) {
          onChange({
            ...element,
            text: newText
          });
        }
        removeTextarea();
      }
    });

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 100);
  };

  const curveAmount = element.curveAmount || 0;
  const hasCurve = curveAmount !== 0;

  // Debug curved text
  if (element.text && curveAmount !== 0) {
    console.log('🌈 Curved text rendering:', {
      text: element.text,
      curveAmount,
      fontSize: element.fontSize,
      letterSpacing: element.letterSpacing
    });
  }

  return (
    <>
      {hasCurve ? (
        // Render curved text as Group of individual characters
        <Group
          ref={textRef}
          x={element.x}
          y={element.y}
          rotation={element.rotation || 0}
          scaleX={element.scaleX || 1}
          scaleY={element.scaleY || 1}
          draggable
          onClick={(e) => {
            console.log('🎯 Curved text Group clicked!');
            e.cancelBubble = true;
            if (e.evt) {
              e.evt.stopPropagation();
              e.evt.preventDefault();
            }
            onSelect();
          }}
          onTap={(e) => {
            console.log('📱 Curved text Group tapped!');
            e.cancelBubble = true;
            if (e.evt) {
              e.evt.stopPropagation();
              e.evt.preventDefault();
            }
            onSelect();
          }}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          onDragEnd={(e) => {
            onChange({
              ...element,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={() => {
            const node = textRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            onChange({
              ...element,
              x: node.x(),
              y: node.y(),
              fontSize: Math.max(8, Math.round((element.fontSize || 32) * Math.max(scaleX, scaleY))),
              rotation: node.rotation(),
              scaleX: 1,
              scaleY: 1,
            });

            node.scaleX(1);
            node.scaleY(1);
          }}
        >
          {/* Render individual characters for curved text */}
          {calculateCurvedTextPositions(
            element.text || '',
            element.fontSize || 32,
            curveAmount,
            element.letterSpacing || 0
          ).map((charPos, i) => (
            <KonvaText
              key={i}
              x={charPos.x}
              y={charPos.y}
              text={charPos.char}
              fontSize={element.fontSize || 32}
              fontFamily={element.fontFamily || 'Arial'}
              fill={element.fill || '#000000'}
              fontStyle={`${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold' : 'normal'}`}
              rotation={charPos.rotation}
              listening={true}
              perfectDrawEnabled={false}
            />
          ))}
        </Group>
      ) : (
        // Render straight text
        <KonvaText
          ref={textRef}
          x={element.x}
          y={element.y}
          text={element.text}
          fontSize={element.fontSize || 32}
          fontFamily={element.fontFamily || 'Arial'}
          fill={element.fill || '#000000'}
          fontStyle={`${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold' : 'normal'}`}
          align={element.align || 'left'}
          rotation={element.rotation || 0}
          scaleX={element.scaleX || 1}
          scaleY={element.scaleY || 1}
          letterSpacing={element.letterSpacing || 0}
          draggable
          onClick={(e) => {
            console.log('📝 Straight text clicked!');
            onSelect();
          }}
          onTap={(e) => {
            console.log('📱 Straight text tapped!');
            onSelect();
          }}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          onDragEnd={(e) => {
            onChange({
              ...element,
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onTransformEnd={() => {
            const node = textRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            onChange({
              ...element,
              x: node.x(),
              y: node.y(),
              fontSize: Math.max(8, Math.round((element.fontSize || 32) * Math.max(scaleX, scaleY))),
              rotation: node.rotation(),
              scaleX: 1,
              scaleY: 1,
            });

            node.scaleX(1);
            node.scaleY(1);
          }}
        />
      )}
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          enabledAnchors={['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
          rotateEnabled={true}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 20) {
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
  onTextElementSelect,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const canvasWidth = 600;
  const canvasHeight = 400;

  // Notify parent when text element is selected
  const handleElementSelect = (elementId: string | null, elementType?: string) => {
    console.log('🎯 handleElementSelect called:', { elementId, elementType, hasCallback: !!onTextElementSelect });
    setSelectedElementId(elementId);
    if (elementType === 'text' && onTextElementSelect) {
      console.log('✅ Calling onTextElementSelect with:', elementId);
      onTextElementSelect(elementId);
    } else if (onTextElementSelect) {
      console.log('❌ Calling onTextElementSelect(null)');
      onTextElementSelect(null);
    }
  };

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

  const [productImage] = useImage(getProductImage() || '', 'anonymous');

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
    console.log('🎭 Stage clicked, target:', e.target.constructor.name);
    if (e.target === e.target.getStage()) {
      console.log('👉 Deselecting element');
      setSelectedElementId(null);
      if (onTextElementSelect) {
        onTextElementSelect(null);
      }
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
            {design?.elements.map((element) => {
              if (element.type === 'text') {
                return (
                  <CanvasText
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    onSelect={() => handleElementSelect(element.id, 'text')}
                    onChange={(newAttrs) => updateElement(element.id, newAttrs)}
                  />
                );
              } else {
                return (
                  <CanvasImage
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    onSelect={() => handleElementSelect(element.id, 'image')}
                    onChange={(newAttrs) => updateElement(element.id, newAttrs)}
                  />
                );
              }
            })}
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