import React, { useEffect, useState } from "react";
import { TrashIcon, CheckCircleIcon, EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AiGeneratedGalleryProps {
  onSelect: (imageUrl: string) => void;
  isOpen: boolean;
  images?: SavedItem[]; // ✅ Optional: receive images from parent
  onImagesChange?: (images: SavedItem[]) => void; // ✅ Optional: notify parent when images change
}

interface SavedItem {
  id: string;
  url: string;
  createdAt: string;
  type?: string;
}

const AiGeneratedGallery: React.FC<AiGeneratedGalleryProps> = ({ 
  onSelect, 
  isOpen, 
  images: propImages,
  onImagesChange 
}) => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 🔁 Use prop images if provided, otherwise load from localStorage
  useEffect(() => {
    if (isOpen) {
      if (propImages && Array.isArray(propImages)) {
        setItems(propImages);
      } else {
        const stored = localStorage.getItem("aiGeneratedItems");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setItems(parsed);
          } catch (e) {
            console.error("⚠️ Parse error:", e);
          }
        } else {
          setItems([]);
        }
      }
    }
  }, [isOpen, propImages]);

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem("aiGeneratedItems", JSON.stringify(updated));
    
    // ✅ Notify parent component about the change
    if (onImagesChange) {
      onImagesChange(updated);
    }
  };

  const handleSelect = (item: SavedItem) => {
    setSelectedId(item.id);
    onSelect(item.url);
  };

  if (!items.length)
    return (
      <div className="p-4 text-center text-gray-500">
        ⚡ Chưa có sản phẩm AI nào được lưu, hãy tạo một sản phẩm trong tab AI Cartoon!
      </div>
    );

  return (
    <>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className={`relative border rounded-xl overflow-hidden group cursor-pointer transition-all ${selectedId === item.id ? "ring-2 ring-pink-500 shadow-md" : "hover:ring-1 hover:ring-gray-300 hover:shadow-sm"
              }`}
          >
            <img src={item.url} alt="AI generated" className="w-full h-28 object-cover" />

            {/* Selected Indicator (Top Right) */}
            {selectedId === item.id && (
              <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 shadow-sm z-10">
                <CheckCircleIcon className="w-5 h-5 text-pink-500" />
              </div>
            )}

            {/* Delete Button (Top Left) - Always Visible */}
            <button
              className="absolute top-1 left-1 bg-white/80 hover:bg-white text-gray-500 hover:text-red-600 rounded-full p-1.5 shadow-sm transition-all z-20 backdrop-blur-[2px]"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              title="Xóa"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            {/* Preview Button (Bottom Right) - Always Visible */}
            <button
              className="absolute bottom-1 right-1 bg-white/80 hover:bg-white text-gray-500 hover:text-blue-600 rounded-full p-1.5 shadow-sm transition-all z-20 backdrop-blur-[2px]"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(item.url);
              }}
              title="Xem trước"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 🔍 Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2"
              onClick={() => setPreviewImage(null)}
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AiGeneratedGallery;
