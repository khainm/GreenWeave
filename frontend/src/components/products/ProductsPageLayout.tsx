import React, { useMemo } from 'react';
import Header from '../layout/Header';
import HeroBanner from '../HeroBanner';
import ScrollToTopButton from '../ui/ScrollToTopButton';
import ProductsContent from './ProductsContent';
import ToteCollectionSection from './ToteCollectionSection';
import ProductSearchBar from './ProductSearchBar';
import ProductSearchResults from './ProductSearchResults';
import SearchLoadingOverlay from './SearchLoadingOverlay';
import { useProductSearch } from '../../hooks/useProductSearch';
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
  const {
    searchResults,
    isSearching,
    hasSearched,
    searchError,
    performSearch,
    clearSearch
  } = useProductSearch({ initialProducts: products });

  const categoryNames = useMemo(() => categories.map(cat => cat.name), [categories]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroBanner />
      <ToteCollectionSection />
      
      {/* Search Bar */}
      <ProductSearchBar
        onSearchResults={() => {}}
        onLoading={() => {}}
        categories={categoryNames}
        onSearchRequest={performSearch}
      />

      {/* Search Results */}
      <ProductSearchResults
        results={searchResults}
        hasSearched={hasSearched}
        isSearching={isSearching}
        onClearSearch={clearSearch}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-all duration-300 ease-in-out">
          <ProductsContent
            products={hasSearched ? searchResults : products}
            categories={categories}
            selectedColors={selectedColors}
            onColorSelect={onColorSelect}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>

      {/* Search Loading Overlay - Disabled để tránh gây khó chịu */}
      {/* <SearchLoadingOverlay isVisible={isSearching} /> */}

      <ScrollToTopButton />
    </div>
  );
};

export default ProductsPageLayout;
