import React, { useState } from "react";

interface AiTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  previewImageUrl?: string; // 👈 thêm prop preview ảnh sản phẩm
}

const AiTryOnModal: React.FC<AiTryOnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  previewImageUrl,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🧍‍♀️ Phòng thay đồ AI
        </h2>

        {previewImageUrl && (
          <div className="mb-4">
            <img
              src={previewImageUrl}
              alt="Product Preview"
              className="w-full rounded-lg shadow-md border border-gray-200"
            />
            <p className="text-sm text-gray-500 mt-2">Ảnh sản phẩm hiện tại</p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full mb-4 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />

        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            disabled={!selectedFile}
            onClick={() => selectedFile && onSubmit(selectedFile)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
          >
            Tạo ảnh AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTryOnModal;
