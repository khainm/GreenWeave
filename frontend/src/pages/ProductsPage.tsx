import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import ProductService from '../services/productService';
import type { Product } from '../types/product';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedColors, setSelectedColors] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const data = await ProductService.getAllProducts();
        setProducts(data);
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

  const getPrimaryImageUrl = (p: Product): string => {
    if (!p.images || p.images.length === 0) return '';
    const primary = p.images.find(img => img.isPrimary) || p.images.slice().sort((a,b)=>a.sortOrder-b.sortOrder)[0];
    return primary?.imageUrl || '';
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
          <div key={product.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Image Container */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
              {getPrimaryImageUrl(product) ? (
                <img src={getPrimaryImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có ảnh</div>
              )}
              
              {/* New Badge */}
              {/* Tạm ẩn nhãn NEW; có thể dựa theo createdAt nếu cần */}
              {false && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  NEW
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">
                {product.name}
              </h3>
              
              {/* Price */}
              <div className="mb-3">
                <span className="text-green-600 font-bold text-base">
                  {formatPrice(product.price)}
                </span>
              </div>
              
              {/* Color Options */}
              <div className="flex space-x-1.5">
                {(product.colors || []).map((c, index) => {
                  const color = c.colorCode;
                  const isLightColor = color === '#ffffff' || color?.toLowerCase() === '#f5f5dc';
                  const selected = selectedColors[product.id] || (product.colors?.[0]?.colorCode || '');
                  const isSelected = selected === color;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(product.id, color)}
                      className="w-4 h-4 transition-all duration-200"
                      style={{ 
                        backgroundColor: color,
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #10b981' : 
                                isLightColor ? '1px solid #e5e7eb' : 'none',
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        boxSizing: 'border-box'
                      }}
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
            {grouped['Non-stop'] && <ProductSection title="Túi Tote Non-stop" items={grouped['Non-stop']} />}
            {grouped['Trơn'] && <ProductSection title="Túi Tote Trơn" items={grouped['Trơn']} />}
            {grouped['Thêu'] && <ProductSection title="Túi Tote Thêu" items={grouped['Thêu']} />}
            {grouped['Khác'] && <ProductSection title="Sản phẩm khác" items={grouped['Khác']} />}
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
