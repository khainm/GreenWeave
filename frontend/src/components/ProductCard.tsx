import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  selectedColor?: string;
  onColorSelect: (productId: number, color: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, selectedColor, onColorSelect }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getImageUrlForSelectedColor = (): string => {
    if (!product.images || product.images.length === 0) return '';
    const selected = selectedColor;
    const orderedImages = product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    
    if (selected) {
      const colorIndex = (product.colors || []).findIndex(c => c.colorCode === selected);
      if (colorIndex >= 0 && orderedImages[colorIndex]) {
        return orderedImages[colorIndex].imageUrl;
      }
    }
    
    const primary = product.images.find(img => img.isPrimary) || orderedImages[0];
    return primary?.imageUrl || '';
  };

  const isNewProduct = (): boolean => {
    try {
      const created = new Date(product.createdAt);
      const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    } catch {
      return false;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col transition-transform duration-200 group hover:-translate-y-1 hover:shadow-lg cursor-pointer" 
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image Container */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {getImageUrlForSelectedColor() ? (
          <img 
            src={getImageUrlForSelectedColor()} 
            alt={product.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Chưa có ảnh
          </div>
        )}
        
        {/* New Badge */}
        {isNewProduct() && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            NEW
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-2 text-base group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="mb-3">
          <span className="text-green-600 font-bold text-lg">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-gray-400 line-through ml-2 text-sm">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Info */}
        <div className="mb-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Tồn kho:</span>
            <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-orange-500' : 'text-green-600'}`}>
              {product.stock === 0 ? 'Hết hàng' : `${product.stock} sản phẩm`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Khối lượng:</span>
            <span className="font-semibold text-gray-700">{product.weight} gram</span>
          </div>
        </div>
        
        {/* Color Options */}
        <div className="flex items-center gap-2">
          {(product.colors || []).map((c, index) => {
            const color = c.colorCode;
            const selected = (selectedColor || (product.colors?.[0]?.colorCode || '')).toLowerCase();
            const isSelected = selected === color.toLowerCase();
            const ringClass = isSelected ? 'ring-2 ring-green-500 ring-offset-2' : 'ring-1 ring-gray-200';
            const borderForLight = ['#ffffff', '#f5f5dc'].includes(color.toLowerCase()) ? 'border border-gray-200' : '';
            
            return (
              <button
                key={index}
                aria-label={`Chọn màu ${color}`}
                onClick={() => onColorSelect(product.id, color)}
                className={`w-5 h-5 rounded-full transition-transform duration-150 hover:scale-110 ${ringClass} ${borderForLight}`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;