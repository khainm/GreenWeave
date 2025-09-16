import React from 'react';

type Color = {
  name: string;
  hex: string;
};

export type OutstandingProductsProps = {
  image: string;
  title: string;
  price: string; // already formatted (e.g., "128,000đ")
  colors?: Color[];
  badge?: string; // e.g., "COMBO 2 TÚI 239K"
  sectionHeader?: string; // optional heading shown above the card
};

const OutstandingProducts: React.FC<OutstandingProductsProps> = ({ image, title, price, colors = [], badge, sectionHeader }) => {
  return (
    <div className="group">
      {sectionHeader && (
        <h3 className="mb-4 text-xl md:text-2xl font-semibold text-gray-900">
          {sectionHeader}
        </h3>
      )}
      <div className="relative rounded-2xl overflow-hidden bg-white">
        {badge && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-green-600/90 text-white text-xs font-semibold px-3 py-1 shadow">
            {badge}
          </div>
        )}
        <div className="aspect-[16/12] w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="mt-4">
        <h6 className="text-lg font-semibold text-gray-900">{title}</h6>
        <p className="mt-3 text-2xl font-bold text-green-700">{price}</p>

        {colors.length > 0 && (
          <div className="mt-3 flex items-center space-x-3">
            {colors.map((c, idx) => (
              <span
                key={idx}
                className={`inline-block h-5 w-5 rounded-full`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingProducts;


