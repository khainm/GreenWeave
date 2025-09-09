import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

interface CustomizableProductCardProps {
  product: Product;
  category: Category;
}

const CustomizableProductCard: React.FC<CustomizableProductCardProps> = ({ product, category }) => {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [selectedPattern, setSelectedPattern] = useState('solid');

  const patterns = [
    { id: 'solid', name: 'Trơn', icon: '●' },
    { id: 'stripes', name: 'Sọc', icon: '▬' },
    { id: 'dots', name: 'Chấm bi', icon: '●' },
    { id: 'floral', name: 'Hoa', icon: '❀' },
    { id: 'geometric', name: 'Hình học', icon: '◆' }
  ];

  const colors = [
    { name: 'Trắng', value: '#ffffff' },
    { name: 'Đen', value: '#000000' },
    { name: 'Xanh lá', value: '#10b981' },
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Vàng', value: '#f59e0b' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col transition-transform duration-200 group hover:-translate-y-1 hover:shadow-lg">
      {/* Custom Designer UI */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h3 className="font-semibold text-gray-900">Thiết kế của bạn</h3>
          <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            TÙY BIẾN
          </div>
        </div>
        
        {/* Product Preview */}
        <div className="relative h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
          <div 
            className="w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center text-4xl"
            style={{ 
              backgroundColor: selectedColor,
              color: selectedColor === '#ffffff' ? '#000000' : '#ffffff'
            }}
          >
            {patterns.find(p => p.id === selectedPattern)?.icon || '●'}
          </div>
          {/* Product name overlay */}
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <div className="bg-white bg-opacity-90 rounded-lg px-2 py-1 text-xs font-medium text-gray-800">
              {product.name}
            </div>
          </div>
        </div>

        {/* Pattern Options - Left */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Họa tiết</h4>
          <div className="flex gap-2">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => setSelectedPattern(pattern.id)}
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-sm ${
                  selectedPattern === pattern.id ? 'border-green-500 ring-2 ring-green-200 bg-green-50' : 'border-gray-300 bg-white'
                }`}
                title={pattern.name}
              >
                {pattern.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color Options - Right */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Màu sắc</h4>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color.value ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Design Tools */}
        <div className="flex gap-2 mb-4">
          <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm transition-colors">
            <span className="font-bold">Tt</span> Thêm chữ
          </button>
          <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm transition-colors">
            <span className="font-bold">+</span> Thêm thiết kế
          </button>
        </div>

        {/* Price and Order */}
        <div className="flex items-center justify-between">
          <div className="text-green-600 font-bold text-lg">
            {formatPrice(product.price)}
          </div>
          <button 
            onClick={() => navigate(`/custom/${product.id}`)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizableProductCard;
