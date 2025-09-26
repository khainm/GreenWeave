import React, { useRef, useState } from 'react'
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface PersonalUploadProps {
  onAddImage: (imageUrl: string) => void
  onAddSticker: (stickerUrl: string) => void
}

const PersonalUpload: React.FC<PersonalUploadProps> = ({ 
  onAddImage, 
  onAddSticker 
}) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedStickers, setUploadedStickers] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'image' | 'sticker'>('image')
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'sticker') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validImageTypes.includes(file.type)) {
      alert('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    setIsUploading(true)
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file)
    
    if (type === 'image') {
      setUploadedImages(prev => [...prev, objectUrl])
      onAddImage(objectUrl)
    } else {
      setUploadedStickers(prev => [...prev, objectUrl])
      onAddSticker(objectUrl)
    }
    
    setIsUploading(false)
    
    // Clear input
    event.target.value = ''
  }

  const removeUploadedItem = (url: string, type: 'image' | 'sticker') => {
    if (type === 'image') {
      setUploadedImages(prev => prev.filter(item => item !== url))
    } else {
      setUploadedStickers(prev => prev.filter(item => item !== url))
    }
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(url)
  }

  const triggerFileInput = (type: 'image' | 'sticker') => {
    if (type === 'image') {
      imageInputRef.current?.click()
    } else {
      stickerInputRef.current?.click()
    }
  }

  return (
    <div className="glass-morphism rounded-2xl shadow-xl border border-white/30 p-4 card-hover-effect group">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 gradient-bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <CloudArrowUpIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gradient">Tải lên cá nhân</h3>
          <p className="text-xs text-gray-600 font-medium">Ảnh & Sticker của bạn</p>
        </div>
      </div>

      {/* Upload Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUploadType('image')}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            uploadType === 'image'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <PhotoIcon className="w-4 h-4 inline mr-1" />
          Ảnh
        </button>
        <button
          onClick={() => setUploadType('sticker')}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            uploadType === 'sticker'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <SparklesIcon className="w-4 h-4 inline mr-1" />
          Sticker
        </button>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => triggerFileInput(uploadType)}
        disabled={isUploading}
        className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Đang tải...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            Tải {uploadType === 'image' ? 'ảnh' : 'sticker'} lên
          </div>
        )}
      </button>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />
      <input
        ref={stickerInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'sticker')}
        className="hidden"
      />

      {/* Uploaded Items Display */}
      {(uploadedImages.length > 0 || uploadedStickers.length > 0) && (
        <div className="space-y-3">
          {uploadType === 'image' && uploadedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh đã tải:</h4>
              <div className="grid grid-cols-2 gap-2">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Uploaded image ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeUploadedItem(url, 'image')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddImage(url)}
                      className="absolute inset-0 bg-green-500/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadType === 'sticker' && uploadedStickers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sticker đã tải:</h4>
              <div className="grid grid-cols-3 gap-2">
                {uploadedStickers.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Uploaded sticker ${index + 1}`}
                      className="w-full h-16 object-contain rounded-lg border-2 border-gray-200 bg-white"
                    />
                    <button
                      onClick={() => removeUploadedItem(url, 'sticker')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddSticker(url)}
                      className="absolute inset-0 bg-green-500/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Hướng dẫn:</strong> Chọn file ảnh (JPG, PNG, GIF, WebP) có kích thước tối đa 5MB. 
          Ảnh sẽ được thêm vào canvas, sticker có thể được sử dụng nhiều lần.
        </p>
      </div>
    </div>
  )
}

export default PersonalUpload
