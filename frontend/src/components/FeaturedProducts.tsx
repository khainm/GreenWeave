import React from 'react';
import ProductCard from './ProductCard';

const FeaturedProducts: React.FC = () => {
  const products = [
    {
      image:
        'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?q=80&w=1400&auto=format&fit=crop',
      title: 'Túi Tote Trơn Single',
      price: '128,000đ',
      colors: [
        { name: 'Green', hex: '#0ea66c' },
        { name: 'Beige', hex: '#ede9d5' },
        { name: 'Brown', hex: '#7c3f1d' },
        { name: 'Black', hex: '#0a0a0a' },
      ],
    },
    {
      image:
        'https://images.unsplash.com/photo-1520975624745-4f7a4f35e979?q=80&w=1400&auto=format&fit=crop',
      title: 'Túi Tote Trơn Combo 2',
      price: '239,000đ',
      colors: [
        { name: 'White', hex: '#ffffff' },
        { name: 'Beige', hex: '#ede9d5' },
        { name: 'Brown', hex: '#7c3f1d' },
        { name: 'Black', hex: '#0a0a0a' },
      ],
      badge: 'COMBO 2 TÚI 239K',
    },
    {
      image:
        'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=1400&auto=format&fit=crop',
      title: 'Túi Tote Trơn Combo 3',
      price: '359,000đ',
      colors: [
        { name: 'White', hex: '#ffffff' },
        { name: 'Beige', hex: '#ede9d5' },
        { name: 'Brown', hex: '#7c3f1d' },
        { name: 'Black', hex: '#0a0a0a' },
      ],
    },
    {
      image:
        'https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1400&auto=format&fit=crop',
      title: 'Túi Tote Trơn Combo 4',
      price: '389,000đ',
      colors: [
        { name: 'White', hex: '#ffffff' },
        { name: 'Beige', hex: '#ede9d5' },
        { name: 'Brown', hex: '#7c3f1d' },
        { name: 'Black', hex: '#0a0a0a' },
      ],
      badge: 'COMBO 4 TÚI 389K',
    },
  ];

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col items-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">Sản phẩm nổi bật</h3>
          {/* <a href="#" className="mt-2 text-green-700 hover:text-green-800 font-medium">Xem tất cả</a> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p, idx) => (
            <ProductCard key={idx} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;


