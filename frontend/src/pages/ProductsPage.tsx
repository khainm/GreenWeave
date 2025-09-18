import React from 'react';
import ProductsPageLayout from '../components/products/ProductsPageLayout';
import { useProducts } from '../hooks/useProducts';

const ProductsPage: React.FC = () => {
  const {
    products,
    categories,
    selectedColors,
    isLoading,
    error,
    handleColorSelect
  } = useProducts();

  return (
    <ProductsPageLayout
      products={products}
      categories={categories}
      selectedColors={selectedColors}
      onColorSelect={handleColorSelect}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default ProductsPage;
