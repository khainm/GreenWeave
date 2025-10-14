import React from 'react';
import ProductsPageLayout from '../components/products/ProductsPageLayout';
import { useProducts } from '../hooks/useProducts';

import { useLocation } from 'react-router-dom';

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const refreshProducts = location.state?.refreshProducts;
  const {
    products,
    categories,
    selectedColors,
    isLoading,
    error,
    handleColorSelect,
    refetching
  } = useProducts(refreshProducts);

  return (
    <>
      {(isLoading || refetching) && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-green-700">
              {isLoading ? 'Đang tải sản phẩm...' : 'Đang cập nhật sản phẩm...'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Vui lòng đợi trong giây lát
            </div>
          </div>
        </div>
      )}
      <ProductsPageLayout
        products={products}
        categories={categories}
        selectedColors={selectedColors}
        onColorSelect={handleColorSelect}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default ProductsPage;
