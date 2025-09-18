import { useEffect, useState } from 'react';
import ProductService from '../services/productService';
import CategoryService from '../services/categoryService';
import type { Product } from '../types/product';
import type { Category } from '../types/category';

interface UseProductsReturn {
  products: Product[];
  categories: Category[];
  selectedColors: {[key: number]: string};
  isLoading: boolean;
  error: string | null;
  handleColorSelect: (productId: number, color: string) => void;
}

export const useProducts = (): UseProductsReturn => {
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

  return {
    products,
    categories,
    selectedColors,
    isLoading,
    error,
    handleColorSelect
  };
};
