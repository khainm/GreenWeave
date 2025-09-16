import React from 'react';
import type { Product } from '../../types/product';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  title: string;
  items: Product[];
  selectedColors: { [key: number]: string };
  onColorSelect: (productId: number, color: string) => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, 
  items, 
  selectedColors, 
  onColorSelect 
}) => {
  return (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-green-600 mr-3"></div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selectedColor={selectedColors[product.id]}
            onColorSelect={onColorSelect}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
