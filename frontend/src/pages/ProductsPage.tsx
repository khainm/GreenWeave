import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getImageUrlForSelectedColor = (p: Product): string => {
    if (!p.images || p.images.length === 0) return '';
    const selected = selectedColors[p.id];
    const orderedImages = p.images.slice().sort((a,b)=>a.sortOrder-b.sortOrder);
    if (selected) {
      const colorIndex = (p.colors || []).findIndex(c => c.colorCode === selected);
      if (colorIndex >= 0 && orderedImages[colorIndex]) {
        return orderedImages[colorIndex].imageUrl;
      }
    }
    const primary = p.images.find(img => img.isPrimary) || orderedImages[0];
    return primary?.imageUrl || '';
  };

  const isNewProduct = (p: Product): boolean => {
    try {
      const created = new Date(p.createdAt);
      const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    } catch {
      return false;
    }
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

  const ProductSection: React.FC<{ title: string; items: Product[] }> = ({ title, items }) => (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-green-600 mr-3"></div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {items.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col transition-transform duration-200 group hover:-translate-y-1 hover:shadow-lg">
            {/* Image Container */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
              {getImageUrlForSelectedColor(product) ? (
                <img src={getImageUrlForSelectedColor(product)} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có ảnh</div>
              )}
              
              {/* New Badge */}
              {isNewProduct(product) && (
                <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  NEW
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-2 text-base group-hover:text-green-700 transition-colors">
                {product.name}
              </h3>
              
              {/* Price */}
              <div className="mb-3">
                <span className="text-green-600 font-bold text-lg">
                  {formatPrice(product.price)}
                </span>
              </div>
              
              {/* Color Options */}
              <div className="flex items-center gap-2">
                {(product.colors || []).map((c, index) => {
                  const color = c.colorCode;
                  const selected = (selectedColors[product.id] || (product.colors?.[0]?.colorCode || '')).toLowerCase();
                  const isSelected = selected === color.toLowerCase();
                  const ringClass = isSelected ? 'ring-2 ring-green-500 ring-offset-2' : 'ring-1 ring-gray-200';
                  const borderForLight = ['#ffffff','#f5f5dc'].includes(color.toLowerCase()) ? 'border border-gray-200' : '';
                  return (
                    <button
                      key={index}
                      aria-label={`Chọn màu ${color}`}
                      onClick={() => handleColorSelect(product.id, color)}
                      className={`w-5 h-5 rounded-full transition-transform duration-150 hover:scale-110 ${ringClass} ${borderForLight}`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
        )}
        {isLoading ? (
          <div className="text-gray-500">Đang tải sản phẩm...</div>
        ) : (
          <>
            {categories.map(cat => (
              grouped[cat.name] && grouped[cat.name].length > 0 ? (
                <ProductSection key={cat.id} title={`Túi Tote ${cat.name}`} items={grouped[cat.name]} />
              ) : null
            ))}
            {grouped['Khác'] && grouped['Khác'].length > 0 && (
              <ProductSection title="Sản phẩm khác" items={grouped['Khác']} />
            )}
          </>
        )}
      </main>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors duration-200 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
};

export default ProductsPage;
