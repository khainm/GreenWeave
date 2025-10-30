import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    if (isGenerated && previewImageUrl) {
      const existingItems = JSON.parse(localStorage.getItem("aiGeneratedItems") || "[]");
      const newItem = {
        id: Date.now().toString(),
        url: previewImageUrl,
        createdAt: new Date().toISOString(),
      };
      const updatedItems = [newItem, ...existingItems].slice(0, 20); // Limit to 20 items
      localStorage.setItem("aiGeneratedItems", JSON.stringify(updatedItems));
    }
  }, [isGenerated, previewImageUrl]);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full text-center relative">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          ✨ AI Cartoon Preview
        </h2>

        {/* Hiển thị ảnh */}
        <img
          src={previewImageUrl}
          alt="Preview"
          className="w-full h-auto rounded-lg mb-4 shadow-md"
        />

        {/* Nút hành động */}
        <div className="flex flex-wrap justify-center gap-3">
          {!isGenerated ? (
            <>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
              >
                {isLoading ? "⏳ Generating..." : "🎨 Generate Cartoon"}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                ❌ Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onConsult}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                🛍️ Tư vấn đặt hàng
              </button>
              <button
                // onClick={onTryOn}
                 onClick={() => {
    if (onTryOn) onTryOn(); // ✅ gọi callback mở modal thử đồ
  }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🧥 Phòng thay đồ
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCartoonModal;
