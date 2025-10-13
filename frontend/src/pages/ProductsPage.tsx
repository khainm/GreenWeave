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
      {(isLoading || refetching) && <div className="fixed inset-0 bg-white bg-opacity-60 z-50 flex items-center justify-center"><div className="text-lg font-semibold text-green-700 animate-pulse">Đang cập nhật sản phẩm...</div></div>}
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
