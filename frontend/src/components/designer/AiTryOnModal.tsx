import React, { useState } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import AiGeneratedGallery from "./AiGeneratedGallery";

interface AiTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userImage: File, productPreviewUrl?: string) => Promise<void> | void;
  previewImageUrl?: string;
  productPreviewUrl?: string;
  aiGeneratedImages?: any[]; // ✅ Nhận danh sách ảnh AI từ parent
  onImagesChange?: (images: any[]) => void; // ✅ Callback khi xóa ảnh
}

const AiTryOnModal: React.FC<AiTryOnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productPreviewUrl,
  aiGeneratedImages,
  onImagesChange,
}) => {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProductUrl, setSelectedProductUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Update selectedProductUrl when productPreviewUrl changes and modal opens
  React.useEffect(() => {
    if (isOpen && productPreviewUrl) {
      console.log('🎨 [AiTryOnModal] Setting productPreviewUrl as selected:', productPreviewUrl.substring(0, 100));
      setSelectedProductUrl(productPreviewUrl);
    }
  }, [isOpen, productPreviewUrl]);

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl p-6 sm:p-8 relative transition-all max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
        {/* ❌ Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        {/* ✨ Header với hướng dẫn */}
        <div className="text-center mb-6 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            ✨ AI Thử Đồ Ảo
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Xem bạn trông như thế nào khi mặc thiết kế AI của mình
          </p>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${userImage ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
              <span className="mr-1">1️⃣</span> Tải ảnh của bạn
            </div>
            <span className="text-gray-400">→</span>
            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${selectedProductUrl ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
              <span className="mr-1">2️⃣</span> Chọn thiết kế
            </div>
            <span className="text-gray-400">→</span>
            <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${userImage && selectedProductUrl ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
              <span className="mr-1">3️⃣</span> Thử ngay
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* 👩 Bước 1: Người dùng */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-blue-200 flex flex-col">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Ảnh của bạn
              </h2>
            </div>

            <div className="flex-1 flex flex-col">
              {previewUrl ? (
                <div className="relative group flex-1 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="User Preview"
                    className="max-h-64 sm:max-h-80 rounded-xl shadow-lg object-contain border-4 border-white"
                  />
                  <button
                    onClick={() => {
                      setUserImage(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex-1 border-3 border-dashed border-blue-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <PhotoIcon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-blue-900 font-semibold mb-1">
                    📸 Tải ảnh lên
                  </p>
                  <p className="text-blue-600 text-sm text-center mb-3">
                    Chọn ảnh chụp toàn thân<br />để kết quả tốt nhất
                  </p>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm group-hover:bg-blue-600 transition-colors">
                    Chọn ảnh từ máy
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {/* Tips */}
            <div className="mt-3 bg-blue-100 border border-blue-300 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium flex items-start">
                <span className="mr-1">💡</span>
                <span>
                  <strong>Mẹo:</strong> Chọn ảnh chụp rõ mặt, đứng thẳng, nền sáng để AI hoạt động tốt nhất
                </span>
              </p>
            </div>
          </div>

          {/* 🧥 Bước 2: Tủ đồ AI */}
          <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-purple-200 flex flex-col">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Chọn thiết kế AI
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-white/50 p-2">
              <AiGeneratedGallery 
                onSelect={setSelectedProductUrl} 
                isOpen={isOpen} 
                images={aiGeneratedImages}
                onImagesChange={onImagesChange}
              />
            </div>

            {selectedProductUrl && (
              <div className="mt-3 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-3">
                <p className="text-sm text-purple-900 font-semibold mb-2 text-center flex items-center justify-center">
                  <span className="mr-1">✅</span> Đã chọn thiết kế
                </p>
                <img
                  src={selectedProductUrl}
                  alt="Selected product"
                  className="max-h-32 rounded-lg mx-auto shadow-md object-contain border-2 border-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* ⚡ Action Button - Fixed at bottom */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!userImage || submitting || !selectedProductUrl}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Thử Đồ Với AI</span>
              </>
            )}
          </button>

          {(!userImage || !selectedProductUrl) && (
            <p className="text-sm text-gray-500 text-center">
              {!userImage && !selectedProductUrl && "👆 Vui lòng tải ảnh và chọn thiết kế"}
              {!userImage && selectedProductUrl && "👆 Vui lòng tải ảnh của bạn"}
              {userImage && !selectedProductUrl && "👆 Vui lòng chọn thiết kế từ tủ đồ"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTryOnModal;
