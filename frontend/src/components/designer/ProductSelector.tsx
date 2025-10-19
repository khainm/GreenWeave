import React, { useState, useEffect } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { CustomProductService } from '../../services/customProductService';
import type { ProductResponseDto } from './types';

interface ProductSelectorProps {
  selectedProduct: ProductResponseDto | null;
  onProductSelect: (product: ProductResponseDto) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  selectedProduct, 
  onProductSelect 
}) => {
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await CustomProductService.getCustomizableProducts();
        // Ensure data is always an array
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Không thể tải danh sách sản phẩm');
        setProducts([]); // Set empty array on error
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sản phẩm</h2>
        <p className="text-sm text-gray-600 mb-6">Chọn để thiết kế</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-28 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sản phẩm</h2>
        <div className="text-center text-red-500 py-8">
          <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-red-300" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sản phẩm</h2>
      <p className="text-sm text-gray-600 mb-6">Chọn để thiết kế</p>
      
            <div className="space-y-3">
        {(products || []).map((product) => {
          // Lấy ảnh chính hoặc ảnh đầu tiên  
          const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
          
          return (
            <div
              key={product.id}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${ 
                selectedProduct?.id === product.id 
                  ? 'border-green-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onProductSelect(product)}
            >
              {primaryImage ? (
                <img
                  src={primaryImage.imageUrl}
                  alt={product.name}
                  className="w-full h-28 object-cover"
                />
              ) : (
                <div className="w-full h-28 bg-gray-200 flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate font-medium">{product.name}</p>
                <p className="text-xs text-green-600 font-semibold">
                  {product.price?.toLocaleString('vi-VN') || '0'}đ
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {product.colors && product.colors.length > 0 && (
                    <p className="text-xs text-blue-600">
                      {product.colors.length} màu
                    </p>
                  )}
                  {product.category && (
                    <p className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                      {product.category}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {(!products || products.length === 0) && !loading && !error && (
        <div className="text-center text-gray-500 py-8">
          <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium mb-2">Chưa có sản phẩm tùy chỉnh</p>
          <p className="text-xs text-gray-400 px-4">
            Sản phẩm cần thuộc danh mục có cờ "IsCustomizable" để hiển thị ở đây
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;