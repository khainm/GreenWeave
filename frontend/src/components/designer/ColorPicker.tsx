import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { ProductResponseDto } from './types';

interface ColorPickerProps {
  product: ProductResponseDto;
  selectedColorCode?: string;
  onColorSelect: (colorCode: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  product,
  selectedColorCode,
  onColorSelect,
}) => {
  const colors = product.colors || [];

  // Nếu không có colors từ API, không hiển thị gì
  if (colors.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Màu sắc</h3>
        <p className="text-sm text-gray-500">Sản phẩm này không có tùy chọn màu</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Màu sắc ({colors.length} màu)
      </h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color, index) => (
          <button
            key={'id' in color ? color.id : index}
            className={`w-10 h-10 rounded-full border-2 transition-all ${
              selectedColorCode === color.colorCode
                ? 'border-gray-600 scale-110 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ 
              backgroundColor: color.colorCode === '#ffffff' || color.colorCode.toLowerCase() === 'white' 
                ? '#f9f9f9' 
                : color.colorCode 
            }}
            onClick={() => onColorSelect(color.colorCode)}
            title={color.colorName || color.colorCode}
          >
            {selectedColorCode === color.colorCode && (
              <div className="w-3 h-3 bg-white rounded-full mx-auto mt-2 shadow-sm"></div>
            )}
          </button>
        ))}
        
        {/* Add custom color button - chỉ hiển thị nếu có ít nhất 1 màu */}
        {colors.length > 0 && (
          <button
            className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-gray-300 bg-gray-50 flex items-center justify-center"
            title="Thêm màu tùy chỉnh"
          >
            <PlusIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
      
      {selectedColorCode && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <span className="text-gray-600">Màu đã chọn: </span>
          <span className="font-medium">
            {colors.find(c => c.colorCode === selectedColorCode)?.colorName || selectedColorCode}
          </span>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;