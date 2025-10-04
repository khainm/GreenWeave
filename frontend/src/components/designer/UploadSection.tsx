import React, { useState } from 'react';
import { CloudArrowUpIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CustomProductService } from './customProductService';
import type { UploadMode } from './types';

interface UploadSectionProps {
  uploadMode: UploadMode;
  onUploadModeChange: (mode: UploadMode) => void;
  onImageUpload: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  uploadMode,
  onUploadModeChange,
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

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const result = await CustomProductService.uploadImage(file, uploadMode);
      
      if (result.success && result.data?.url) {
        // Add to canvas via global method
        if (window.customDesigner?.addImage) {
          window.customDesigner.addImage(result.data.url);
        }
        onImageUpload(file);
      } else {
        alert('Upload thất bại: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploading(false);
      // Clear input
      event.target.value = '';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tải ảnh cá nhân lên</h3>
      
      <div className="flex space-x-2 mb-4">
        <button
          className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
            uploadMode === 'image'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onUploadModeChange('image')}
        >
          <PhotoIcon className="w-4 h-4 inline mr-2" />
          Ảnh
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
            uploadMode === 'sticker'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => onUploadModeChange('sticker')}
        >
          <DocumentTextIcon className="w-4 h-4 inline mr-2" />
          Sticker
        </button>
      </div>

      <label className={`w-full py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer inline-block text-center ${
        uploading 
          ? 'bg-gray-400 text-white cursor-not-allowed' 
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}>
        <CloudArrowUpIcon className="w-4 h-4 inline mr-2" />
        {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      
      <p className="text-xs text-gray-500 mt-2">
        Hướng dẫn: Chọn file ảnh (JPG, PNG, GIF, WebP) có kích thước tối đa 5MB. 
        Ảnh sẽ được thêm vào canvas, sticker có thể được sử dụng nhiều lần.
      </p>
    </div>
  );
};

export default UploadSection;