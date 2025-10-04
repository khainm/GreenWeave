import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import type { ProductResponseDto } from './types';

interface StickerLibraryProps {
  product: ProductResponseDto | null;
  onStickerSelect: (stickerUrl: string) => void;
}

const StickerLibrary: React.FC<StickerLibraryProps> = ({
  product,
  onStickerSelect,
}) => {
  if (!product || !product.stickers || product.stickers.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thư viện Sticker</h3>
        <div className="text-center text-gray-500 py-4">
          <PhotoIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Sản phẩm này chưa có sticker</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Thư viện Sticker ({product.stickers.length})
      </h3>
      
      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
        {product.stickers.map((sticker) => (
          <button
            key={sticker.id}
            className="aspect-square border border-gray-200 rounded-lg overflow-hidden hover:border-green-300 hover:bg-green-50 transition-colors group"
            onClick={() => onStickerSelect(sticker.imageUrl)}
            title="Click để thêm sticker vào canvas"
          >
            <img
              src={sticker.imageUrl}
              alt={`Sticker ${sticker.id}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Click vào sticker để thêm vào canvas. Bạn có thể sử dụng sticker nhiều lần.
      </p>
    </div>
  );
};

export default StickerLibrary;