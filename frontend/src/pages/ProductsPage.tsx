import React, { useState } from 'react';
import Header from '../components/Header';

interface ToteProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  colors: string[];
  selectedColor: string;
  isNew?: boolean;
  combo?: string;
}

const ProductsPage: React.FC = () => {
  const [selectedColors, setSelectedColors] = useState<{[key: number]: string}>({});

  const nonStopProducts: ToteProduct[] = [
    {
      id: 1,
      name: 'Túi Tote Non-stop Single',
      description: '',
      price: 159000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#10b981', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#10b981',
      isNew: true
    },
    {
      id: 2,
      name: 'Túi Tote Non-stop Combo 2',
      description: '',
      price: 299000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    },
    {
      id: 3,
      name: 'Túi Tote Non-stop Combo 3',
      description: '',
      price: 389000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    },
    {
      id: 4,
      name: 'Túi Tote Non-stop Combo 4',
      description: '',
      price: 479000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    }
  ];

  const plainProducts: ToteProduct[] = [
    {
      id: 5,
      name: 'Túi Tote Trơn Single',
      description: '',
      price: 128000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#10b981', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#10b981'
    },
    {
      id: 6,
      name: 'Túi Tote Trơn Combo 2',
      description: '',
      price: 239000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    },
    {
      id: 7,
      name: 'Túi Tote Trơn Combo 3',
      description: '',
      price: 359000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    },
    {
      id: 8,
      name: 'Túi Tote Trơn Combo 4',
      description: '',
      price: 389000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff'
    }
  ];

  const personalizedProducts: ToteProduct[] = [
    {
      id: 9,
      name: 'Túi Tote Thêu Cá Nhân Hóa',
      description: '',
      price: 250000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      colors: ['#ffffff', '#f5f5dc', '#8b4513', '#000000'],
      selectedColor: '#ffffff',
      isNew: true
    }
  ];

  const handleColorSelect = (productId: number, color: string) => {
    setSelectedColors(prev => ({
      ...prev,
      [productId]: color
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const ProductSection: React.FC<{ title: string; products: ToteProduct[] }> = ({ title, products }) => (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-green-600 mr-3"></div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white">
            {/* Image Container */}
            <div className="relative h-64 bg-gray-100 overflow-hidden mb-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* New Badge */}
              {product.isNew && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  NEW
                </div>
              )}
            </div>

            {/* Content */}
            <div>
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
                {product.colors.map((color, index) => {
                  const isLightColor = color === '#ffffff' || color === '#f5f5dc';
                  const isSelected = (selectedColors[product.id] || product.selectedColor) === color;
                  
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
        {/* Product Sections */}
        <ProductSection title="Túi Tote Trẻ Người Non-stop" products={nonStopProducts} />
        <ProductSection title="Túi Tote Trơn" products={plainProducts} />
        <ProductSection title="Túi Tote Thêu Cá Nhân Hóa" products={personalizedProducts} />
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
