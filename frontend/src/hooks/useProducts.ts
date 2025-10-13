import { useEffect, useState, useRef } from 'react';
import ProductService from '../services/productService';
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

  const fetchProducts = async (isRefetch = false) => {
    try {
      setError(null);
      if (isRefetch) setRefetching(true); else setIsLoading(true);
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
      if (isRefetch) setRefetching(false); else setIsLoading(false);
    }
  };

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
