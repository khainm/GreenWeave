import React, { useEffect, useState } from "react";
import { TrashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface AiGeneratedGalleryProps {
  onSelect: (imageUrl: string) => void;
  isOpen: boolean; // 👈 thêm dòng này
}

interface SavedItem {
  id: string;
  url: string;
  createdAt: string;
  type?: string; // ✨ Thêm để phân biệt cartoon vs tryon
}

const AiGeneratedGallery: React.FC<AiGeneratedGalleryProps> = ({ onSelect, isOpen }) => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 🔁 Mỗi khi modal mở → reload lại dữ liệu
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("aiGeneratedItems");
      console.log("📦 Reload wardrobe:", stored);
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
  }, [isOpen]); // 👈 dependency chính

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem("aiGeneratedItems", JSON.stringify(updated));
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
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item)}
          className={`relative border rounded-xl overflow-hidden group cursor-pointer ${
            selectedId === item.id ? "ring-2 ring-pink-500" : "hover:ring-1 hover:ring-gray-300"
          }`}
        >
          <img src={item.url} alt="AI generated" className="w-full h-28 object-cover" />
          {selectedId === item.id && (
            <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
              <CheckCircleIcon className="w-5 h-5 text-pink-500" />
            </div>
          )}
          <button
            className="absolute top-2 left-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
          >
            <TrashIcon className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AiGeneratedGallery;
