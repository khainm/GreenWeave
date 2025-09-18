import React, { useMemo } from 'react';
import ProductSection from './ProductSection';
import type { Product } from '../../types/product';
import type { Category } from '../../types/category';

interface ProductsSectionsProps {
  products: Product[];
  categories: Category[];
  selectedColors: {[key: number]: string};
  onColorSelect: (productId: number, color: string) => void;
}

const ProductsSections: React.FC<ProductsSectionsProps> = ({
  products,
  categories,
  selectedColors,
  onColorSelect
}) => {
  const grouped = useMemo(() => {
    const byCat: Record<string, Product[]> = {};
    for (const p of products) {
      const cat = p.category || 'Khác';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(p);
    }
    return byCat;
  }, [products]);

  return (
    <>
      {categories.map(cat => (
        grouped[cat.name] && grouped[cat.name].length > 0 ? (
          <ProductSection 
            key={cat.id} 
            title={`Túi Tote ${cat.name}`} 
            items={grouped[cat.name]}
            selectedColors={selectedColors}
            onColorSelect={onColorSelect}
          />
        ) : null
      ))}
      {grouped['Khác'] && grouped['Khác'].length > 0 && (
        <ProductSection 
          title="Sản phẩm khác" 
          items={grouped['Khác']}
          selectedColors={selectedColors}
          onColorSelect={onColorSelect}
        />
      )}
    </>
  );
};

export default ProductsSections;
