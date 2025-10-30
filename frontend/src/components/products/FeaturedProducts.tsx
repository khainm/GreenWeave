import React, { useState, useEffect } from 'react';
import FeaturedProductCard from './FeaturedProductCard';
import ProductService from '../../services/productService';
import type { Product } from '../../types/product';

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await ProductService.getAllProducts();
      const featuredProducts = allProducts.filter(product => product.isFeatured).slice(0, 4);
      setProducts(featuredProducts);
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError('Không thể tải sản phẩm nổi bật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col items-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">Sản phẩm nổi bật</h3>
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
            {products.map(product => (
              <FeaturedProductCard
                key={product.id}
                image={product.images.length > 0 ? product.images[0].imageUrl : ''}
                title={product.name}
                price={product.price ? `${(product.salePrice || product.price).toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                colors={product.variants?.map(variant => ({ name: variant.colorName, hex: variant.colorHex })) || []}
                badge={product.salePrice && product.price ? `GIẢM GIÁ ${Math.round((1 - product.salePrice / product.price) * 100)}%` : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;


