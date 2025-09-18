import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ProductsSections from './ProductsSections';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

interface ProductsContentProps {
  products: Product[];
  categories: Category[];
  selectedColors: {[key: number]: string};
  onColorSelect: (productId: number, color: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ProductsContent: React.FC<ProductsContentProps> = ({
  products,
  categories,
  selectedColors,
  onColorSelect,
  isLoading,
  error
}) => {
  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Đang tải sản phẩm..." />;
  }

  return (
    <ProductsSections
      products={products}
      categories={categories}
      selectedColors={selectedColors}
      onColorSelect={onColorSelect}
    />
  );
};

export default ProductsContent;
