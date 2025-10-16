import React from 'react';
import ProductsPageLayout from '../components/products/ProductsPageLayout';
import ProductSkeleton from '../components/products/ProductSkeleton';
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

  // 🚀 INSTANT LOADING: Show skeleton immediately for perceived performance
  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar skeleton */}
            <div className="lg:w-1/4">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Products skeleton */}
            <div className="lg:w-3/4">
              <ProductSkeleton count={8} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {refetching && (
        <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-green-700">
              Đang cập nhật sản phẩm...
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
