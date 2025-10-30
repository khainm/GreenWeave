import React, { useState } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import AiGeneratedGallery from "./AiGeneratedGallery";

interface AiTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userImage: File, productPreviewUrl?: string) => Promise<void> | void;
  previewImageUrl?: string;
  productPreviewUrl?: string;
}

const AiTryOnModal: React.FC<AiTryOnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productPreviewUrl,
}) => {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProductUrl, setSelectedProductUrl] = useState<string | null>(
    productPreviewUrl || null
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setUserImage(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    if (!userImage) return alert("⚠️ Vui lòng chọn ảnh của bạn.");
    if (!selectedProductUrl)
      return alert("⚠️ Hãy chọn sản phẩm AI trong tủ đồ để thử.");

    try {
      setSubmitting(true);
      await onSubmit(userImage, selectedProductUrl);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl p-8 relative flex flex-col sm:flex-row gap-6 transition-all">
        {/* ❌ Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        {/* 👩 Người dùng */}
        <div className="flex-1 bg-gray-50 rounded-2xl p-6 shadow-inner">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            🧍 Ảnh người dùng
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center mb-5 hover:border-blue-400 transition-all bg-white/80">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="User Preview"
                className="mx-auto rounded-xl shadow-md max-h-72 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <PhotoIcon className="w-10 h-10 text-gray-400" />
                <p className="text-gray-500 text-sm">
                  Chọn ảnh của bạn để thử đồ
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="mt-4 w-full text-sm text-gray-600"
              onChange={handleFileChange}
            />
          </div>

          {selectedProductUrl && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-sm text-emerald-700 font-medium mb-2">
                👜 Sản phẩm bạn đã chọn để thử
              </p>
              <img
                src={selectedProductUrl}
                alt="Selected product"
                className="max-h-48 rounded-lg mx-auto shadow-sm object-contain"
              />
            </div>
          )}
        </div>

        {/* 🧥 Tủ đồ AI */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-2xl shadow-inner p-6 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            👗 Tủ đồ AI của bạn
          </h2>

          <div className="flex-1 overflow-y-auto">
            <AiGeneratedGallery onSelect={setSelectedProductUrl} isOpen={isOpen} />

          </div>
        </div>

        {/* ⚡ Action */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!userImage || submitting || !selectedProductUrl}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-md hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            {submitting ? "⏳ Đang tạo..." : "⚡ Thử ngay với AI"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTryOnModal;
