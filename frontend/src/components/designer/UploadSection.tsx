import React, { useState } from 'react';
import { PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { CustomProductService } from '../../services/customProductService';

interface UploadSectionProps {
  onImageUpload: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  onImageUpload,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }

    try {
      setUploading(true);
      const result = await CustomProductService.uploadImage(file);
      
      if (result.success && result.url) {
        // Add to canvas via global method
        if (window.customDesigner?.addImage) {
          window.customDesigner.addImage(result.url);
        }
        onImageUpload(file);
      } else {
        alert('Upload thất bại');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploading(false);
      // Clear input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        📸 Tải ảnh cá nhân của bạn lên canvas
      </p>

      <label className={`w-full py-3 px-4 rounded-lg font-medium transition-all cursor-pointer inline-flex items-center justify-center space-x-2 ${
        uploading 
          ? 'bg-gray-400 text-white cursor-not-allowed' 
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
      }`}>
        <CloudArrowUpIcon className="w-5 h-5" />
        <span>{uploading ? 'Đang tải lên...' : 'Chọn ảnh để tải lên'}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>✓ Hỗ trợ: JPG, PNG, GIF, WebP</p>
        <p>✓ Kích thước tối đa: 10MB</p>
        <p>💡 Ảnh sẽ được thêm vào canvas để chỉnh sửa</p>
      </div>
    </div>
  );
};

export default UploadSection;