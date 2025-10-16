import { useEffect, useState, useRef } from 'react';
import { ProductService } from '../services/productService';
import CategoryService from '../services/categoryService';
import type { Product } from '../types/product';
import type { Category } from '../types/category';

interface UseProductsReturn {
  products: Product[];
  categories: Category[];
  selectedColors: { [key: number]: string };
  isLoading: boolean;
  error: string | null;
  handleColorSelect: (productId: number, color: string) => void;
  refetching: boolean;
}

export const useProducts = (refreshFlag?: boolean): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedColors, setSelectedColors] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refetching, setRefetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  // 🚀 Ultra-fast optimized fetch with instant UI feedback
  const fetchProducts = async (isRefetch = false) => {
    try {
      setError(null);
      if (isRefetch) setRefetching(true); else setIsLoading(true);
      
      console.log('🚀 [useProducts] Starting ultra-fast data fetch...');
      const startTime = performance.now();
      
      // 🚀 OPTIMIZATION 1: Fast parallel fetch with aggressive timeouts
      const fetchWithTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      // 🚀 OPTIMIZATION 2: Aggressive parallel loading with 3s timeout
      const [prods, cats] = await Promise.all([
        fetchWithTimeout(ProductService.getAllProducts(true), 3000),
        fetchWithTimeout(CategoryService.list(true), 3000).catch(() => [])
      ]);
      
      const endTime = performance.now();
      console.log(`⚡ [useProducts] Data fetched in ${(endTime - startTime).toFixed(2)}ms`);
      
      // 🚀 OPTIMIZATION 3: Instant category filtering (no async operations)
      const filteredCategories = (cats as Category[])
        .filter(c => c.status === 'active' && !c.isCustomizable)
        .sort((a,b) => a.sortOrder - b.sortOrder);
      
      // 🚀 OPTIMIZATION 4: Fast product filtering
      const allowedCategoryNames = new Set(filteredCategories.map(c => c.name));
      const filteredProducts = prods.filter(p => allowedCategoryNames.has(p.category));
      
      // 🚀 OPTIMIZATION 5: Batch state updates to avoid multiple re-renders
      setProducts(filteredProducts);
      setCategories(filteredCategories);
      
      // 🚀 OPTIMIZATION 6: Performance metrics logging
      if (endTime - startTime > 1000) {
        console.warn(`⚠️ [useProducts] Slow loading detected: ${(endTime - startTime).toFixed(2)}ms`);
      }
      
    } catch (e) {
      console.error('❌ [useProducts] Fetch error:', e);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
    } finally {
      if (isRefetch) setRefetching(false); else setIsLoading(false);
    }
  };

  // 🚀 Handle realtime stock updates
  useEffect(() => {
    const handleStockChange = (event: any) => {
      const { productId, availableStock } = event.detail;
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, stock: availableStock }
            : product
        )
      );
      
      console.log(`🔄 [useProducts] Updated product ${productId} stock to ${availableStock}`);
    };

    // Listen for realtime stock changes
    window.addEventListener('stock:changed', handleStockChange);
    
    return () => {
      window.removeEventListener('stock:changed', handleStockChange);
    };
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!firstLoad.current && refreshFlag) {
      fetchProducts(true);
    }
    firstLoad.current = false;
    // eslint-disable-next-line
  }, [refreshFlag]);

  const handleColorSelect = (productId: number, color: string) => {
    setSelectedColors(prev => ({ ...prev, [productId]: color }));
  };

  return {
    products,
    categories,
    selectedColors,
    isLoading,
    error,
    handleColorSelect,
    refetching
  };
};
