import React from 'react';
import Header from '../layout/Header';
import HeroBanner from '../HeroBanner';
import ScrollToTopButton from '../ui/ScrollToTopButton';
import ProductsContent from './ProductsContent';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

interface ProductsPageLayoutProps {
  products: Product[];
  categories: Category[];
  selectedColors: {[key: number]: string};
  onColorSelect: (productId: number, color: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ProductsPageLayout: React.FC<ProductsPageLayoutProps> = ({
  products,
  categories,
  selectedColors,
  onColorSelect,
  isLoading,
  error
}) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroBanner />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductsContent
          products={products}
          categories={categories}
          selectedColors={selectedColors}
          onColorSelect={onColorSelect}
          isLoading={isLoading}
          error={error}
        />
      </main>

      <ScrollToTopButton />
    </div>
  );
};

export default ProductsPageLayout;
