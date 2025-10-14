import React, { useState, useEffect } from 'react';
import FeaturedProductCard from './FeaturedProductCard';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  category: string;
  description?: string;
  images: { id: number; imageUrl: string; displayOrder: number }[];
  variants: { id: number; colorName: string; colorHex: string; stock: number }[];
  isActive: boolean;
  isFeatured: boolean;
}

interface FeaturedProductProps {
  image: string;
  title: string;
  price: string;
  colors: { name: string; hex: string }[];
  badge?: string;
}

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<FeaturedProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?page=1&pageSize=4');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      const data: Product[] = result.data || [];
      
      // Transform API data to component props format
      const transformedProducts: FeaturedProductProps[] = data.map(product => ({
        image: product.images.length > 0 
          ? product.images.sort((a, b) => a.displayOrder - b.displayOrder)[0].imageUrl
          : 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?q=80&w=1400&auto=format&fit=crop',
        title: product.name,
        price: product.salePrice 
          ? `${product.salePrice.toLocaleString('vi-VN')}₫`
          : `${product.price.toLocaleString('vi-VN')}₫`,
        colors: product.variants && product.variants.length > 0 
          ? product.variants.map(variant => ({
              name: variant.colorName,
              hex: variant.colorHex
            }))
          : [
              { name: 'Vàng', hex: '#ffd700' },
              { name: 'Xanh Bích', hex: '#40e0d0' },
              { name: 'Đỏ', hex: '#dc2626' },
              { name: 'Xanh Đen', hex: '#1e3a8a' },
            ],
        badge: product.salePrice ? `GIẢM GIÁ ${Math.round((1 - product.salePrice/product.price) * 100)}%` : undefined
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError('Không thể tải sản phẩm nổi bật');
      
      // Fallback to sample data if API fails
      setProducts([
        {
          image: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?q=80&w=1400&auto=format&fit=crop',
          title: 'Túi Tote Cơ Bản',
          price: '159,000₫',
          colors: [
            { name: 'Xanh Lá', hex: '#0ea66c' },
            { name: 'Kem', hex: '#ede9d5' },
            { name: 'Nâu', hex: '#7c3f1d' },
            { name: 'Đen', hex: '#0a0a0a' },
          ],
        },
        {
          image: 'https://images.unsplash.com/photo-1520975624745-4f7a4f35e979?q=80&w=1400&auto=format&fit=crop',
          title: 'Túi Tote Premium',
          price: '299,000₫',
          colors: [
            { name: 'Trắng', hex: '#ffffff' },
            { name: 'Kem', hex: '#ede9d5' },
            { name: 'Nâu', hex: '#7c3f1d' },
            { name: 'Đen', hex: '#0a0a0a' },
          ],
          badge: 'BÁN CHẠY',
        },
        {
          image: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=1400&auto=format&fit=crop',
          title: 'Túi Tote Deluxe',
          price: '479,000₫',
          colors: [
            { name: 'Vàng', hex: '#ffd700' },
            { name: 'Xanh Bích', hex: '#40e0d0' },
            { name: 'Đỏ', hex: '#dc2626' },
            { name: 'Xanh Đen', hex: '#1e3a8a' },
          ],
        },
        {
          image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1400&auto=format&fit=crop',
          title: 'Túi Tote Đặc Biệt',
          price: '259,000₫',
          colors: [
            { name: 'Vàng', hex: '#ffd700' },
            { name: 'Xanh Bích', hex: '#40e0d0' },
            { name: 'Đỏ', hex: '#dc2626' },
            { name: 'Xanh Đen', hex: '#1e3a8a' },
          ],
          badge: 'MỚI',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col items-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">Sản phẩm nổi bật</h3>
          {/* <a href="#" className="mt-2 text-green-700 hover:text-green-800 font-medium">Xem tất cả</a> */}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, colorIdx) => (
                    <div key={colorIdx} className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchFeaturedProducts}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p, idx) => (
              <FeaturedProductCard key={idx} {...p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;


