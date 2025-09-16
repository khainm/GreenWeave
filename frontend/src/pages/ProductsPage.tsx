import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import ProductSection from '../components/products/ProductSection';
import ScrollToTopButton from '../components/ui/ScrollToTopButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import ProductService from '../services/productService';
import CategoryService from '../services/categoryService';
import type { Product } from '../types/product';
import type { Category } from '../types/category';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedColors, setSelectedColors] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const [prods, cats] = await Promise.all([
          ProductService.getAllProducts(),
          CategoryService.list().catch(() => [])
        ]);
        setProducts(prods);
        setCategories((cats as Category[]).filter(c => c.status === 'active').sort((a,b) => a.sortOrder - b.sortOrder));
      } catch (e) {
        console.error(e);
        setError('Không thể tải danh sách sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleColorSelect = (productId: number, color: string) => {
    setSelectedColors(prev => ({ ...prev, [productId]: color }));
  };

  const grouped = useMemo(() => {
    const byCat: Record<string, Product[]> = {};
    for (const p of products) {
      const cat = p.category || 'Khác';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(p);
    }
    return byCat;
  }, [products]);


  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorMessage message={error} />}
        
        {isLoading ? (
          <LoadingSpinner message="Đang tải sản phẩm..." />
        ) : (
          <>
            {categories.map(cat => (
              grouped[cat.name] && grouped[cat.name].length > 0 ? (
                <ProductSection 
                  key={cat.id} 
                  title={`Túi Tote ${cat.name}`} 
                  items={grouped[cat.name]}
                  selectedColors={selectedColors}
                  onColorSelect={handleColorSelect}
                />
              ) : null
            ))}
            {grouped['Khác'] && grouped['Khác'].length > 0 && (
              <ProductSection 
                title="Sản phẩm khác" 
                items={grouped['Khác']}
                selectedColors={selectedColors}
                onColorSelect={handleColorSelect}
              />
            )}
          </>
        )}
      </main>

      <ScrollToTopButton />
    </div>
  );
};

export default ProductsPage;
