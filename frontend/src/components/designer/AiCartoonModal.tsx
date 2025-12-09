import React, { useState } from "react";

interface AiCartoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  previewImageUrl?: string;
  onConsult?: () => void;
  onTryOn?: () => void;
}

const AiCartoonModal: React.FC<AiCartoonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  previewImageUrl,
  onConsult,
  onTryOn
}) => {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Removed localStorage saving logic - handled by parent component
  // This prevents duplicate saves and ensures proper state updates

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      await onSubmit();
      setIsGenerated(true);
    } catch (e) {
      console.error(e);
      alert("AI Cartoon generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-orange-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden transform transition-all duration-300 hover:shadow-pink-500/20">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-300"
          >
            <span className="text-xl">×</span>
          </button>
          <div className="text-center">
            <div className="inline-block p-3 bg-white/20 rounded-2xl mb-3 backdrop-blur-sm">
              <span className="text-4xl">🎨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              AI Cartoon Magic
            </h2>
            <p className="text-white/90 text-sm">
              {isGenerated ? "✨ Thiết kế của bạn đã sẵn sàng!" : "🚀 Biến thiết kế thành cartoon nghệ thuật"}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Image Preview with Decorative Border */}
          <div className="relative mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative">
              <img
                src={previewImageUrl}
                alt="AI Cartoon Preview"
                className="w-full h-auto rounded-xl shadow-lg ring-4 ring-white"
              />
              {isGenerated && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 animate-bounce">
                  <span>✓</span> Hoàn thành
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isGenerated ? (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Đang tạo phép màu...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🎨</span>
                        <span>Tạo Cartoon AI Ngay</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Huỷ bỏ
                </button>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onConsult}
                  className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🛍️</span>
                  <span>Tư vấn đặt hàng</span>
                </button>
                <button
                  onClick={() => {
                    if (onTryOn) onTryOn();
                  }}
                  className="py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🧥</span>
                  <span>Phòng thay đồ</span>
                </button>
                <button
                  onClick={onClose}
                  className="sm:col-span-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>

          {/* Tips Section */}
          {!isGenerated && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Mẹo nhỏ:</p>
                  <p>AI sẽ biến thiết kế của bạn thành phong cách cartoon nghệ thuật với màu sắc sống động và nét vẽ độc đáo!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCartoonModal;
