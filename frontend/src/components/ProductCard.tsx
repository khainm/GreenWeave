import React from 'react';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onAddToCart?: (id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  originalPrice,
  image,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
      {/* Image Container - Fixed height */}
      <div className="relative h-48 bg-gray-200 overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite?.(id)}
          className="absolute top-2 right-2 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200"
        >
          {isFavorite ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Content - Flexible height */}
      <div className="p-4 flex flex-col flex-grow min-h-0">
        {/* Title - Flexible height with min/max */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] max-h-[3rem]">
          {name}
        </h3>
        
        {/* Description - Flexible height with min/max */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[1.5rem] max-h-[2.5rem]">
          {description}
        </p>
        
        {/* Price - Fixed height */}
        <div className="flex items-center justify-between mb-4 h-6 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold text-lg">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-gray-400 text-sm line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
        
        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>
        
        {/* Add to Cart Button - Fixed height */}
        <button
          onClick={() => onAddToCart?.(id)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2 flex-shrink-0"
        >
          <ShoppingCartIcon className="h-4 w-4" />
          <span>Thêm vào giỏ</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
