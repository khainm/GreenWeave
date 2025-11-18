// 🌿 Premium Consultation Modal Component (Scroll-Fixed v2)
// Fix: textarea scrollable, footer không che nội dung

import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { ContactInfo, ContactFormErrors } from './types';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactInfo: ContactInfo, selectedImageUrl?: string) => Promise<void>; // ✨ Thêm selectedImageUrl
  isSubmitting: boolean;
  productPreviewUrl?: string;
  productName: string;
  aiGeneratedImages?: Array<{ id: string; url: string; createdAt: string; type?: string }>;
}

const CONTACT_METHODS = [
  { value: 'phone', label: 'Điện thoại', icon: PhoneIcon, placeholder: '0123 456 789', description: 'Gọi trực tiếp để tư vấn nhanh' },
  { value: 'zalo', label: 'Zalo', icon: ChatBubbleLeftRightIcon, placeholder: 'Số Zalo hoặc tên người dùng', description: 'Nhắn tin qua Zalo để được hỗ trợ' },
  { value: 'facebook', label: 'Facebook', icon: ChatBubbleLeftRightIcon, placeholder: 'Link Facebook hoặc tên tài khoản', description: 'Liên hệ qua Facebook Messenger' },
] as const;

const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  productName,
  productPreviewUrl,
  aiGeneratedImages = [], // ✨ Nhận AI gallery
}) => {
  const [formData, setFormData] = useState<ContactInfo>({
    preferredContact: 'phone',
    customerName: '',
    phone: '',
    zalo: '',
    facebook: '',
    notes: '',
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(productPreviewUrl || ''); // ✨ Ảnh được chọn

  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const validateForm = useCallback(() => {
    const newErrors: ContactFormErrors = {};
    if (!formData.customerName?.trim()) newErrors.customerName = 'Vui lòng nhập tên của bạn';
    const { preferredContact } = formData;
    if (preferredContact === 'phone' && !formData.phone?.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (preferredContact === 'zalo' && !formData.zalo?.trim()) newErrors.zalo = 'Vui lòng nhập thông tin Zalo';
    if (preferredContact === 'facebook' && !formData.facebook?.trim()) newErrors.facebook = 'Vui lòng nhập thông tin Facebook';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;
      try {
        await onSubmit(formData, selectedImageUrl); // ✨ Truyền selectedImageUrl
        setFormData({ preferredContact: 'phone', customerName: '', phone: '', zalo: '', facebook: '', notes: '' });
        setErrors({});
        onClose();
      } catch (err) {
        console.error('Consultation submission failed:', err);
      }
    },
    [formData, validateForm, onSubmit, onClose, selectedImageUrl] // ✨ Thêm dependency
  );

  const handleInputChange = useCallback(
    (field: keyof ContactInfo, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof ContactFormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [errors]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isVisible) return null;
  const selectedMethod = CONTACT_METHODS.find((m) => m.value === formData.preferredContact);

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header with Steps */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white p-6 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 hover:rotate-90 transition-all duration-300 disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
              <span className="text-3xl">🛍️</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Tư Vấn Đặt Hàng</h2>
            <p className="text-white/90 text-sm">Chúng tôi sẽ liên hệ bạn trong 24h</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-2 text-xs">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="w-5 h-5 bg-white text-green-600 rounded-full flex items-center justify-center font-bold">1</span>
              <span className="font-medium">Chọn ảnh</span>
            </div>
            <div className="w-6 h-0.5 bg-white/30"></div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="w-5 h-5 bg-white text-green-600 rounded-full flex items-center justify-center font-bold">2</span>
              <span className="font-medium">Điền thông tin</span>
            </div>
            <div className="w-6 h-0.5 bg-white/30"></div>
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="w-5 h-5 bg-white text-green-600 rounded-full flex items-center justify-center font-bold">3</span>
              <span className="font-medium">Gửi yêu cầu</span>
            </div>
          </div>
        </div>

        {/* Body scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Product & Image Selection */}
          <div className="relative">
            <div className="absolute -left-2 top-0 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
              1
            </div>
            <div className="ml-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">📦 Sản phẩm của bạn</h3>
                  <p className="text-gray-800 font-semibold text-base mb-3">{productName}</p>
                  
                  {/* AI Generated Gallery */}
                  {aiGeneratedImages.filter(img => img.type === 'cartoon').length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-2xl">🎨</span>
                        <p className="text-sm font-semibold text-gray-700">Chọn thiết kế bạn thích:</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Canvas hiện tại */}
                        {productPreviewUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedImageUrl(productPreviewUrl)}
                            className={`group relative rounded-xl overflow-hidden border-3 transition-all transform hover:scale-105 ${
                              selectedImageUrl === productPreviewUrl
                                ? 'border-emerald-500 ring-4 ring-emerald-300 shadow-lg'
                                : 'border-gray-200 hover:border-emerald-300 shadow-md hover:shadow-xl'
                            }`}
                          >
                            <img
                              src={productPreviewUrl}
                              alt="Canvas hiện tại"
                              className="w-full h-28 object-cover"
                            />
                            {selectedImageUrl === productPreviewUrl && (
                              <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-emerald-500 text-white rounded-full p-2 shadow-xl transform scale-110">
                                  <CheckCircleIcon className="w-6 h-6" />
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs px-2 py-2 font-semibold">
                              🖌️ Canvas
                            </div>
                          </button>
                        )}
                        
                        {/* AI Generated Images */}
                        {aiGeneratedImages.filter(img => img.type === 'cartoon').map((img, index) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedImageUrl(img.url)}
                            className={`group relative rounded-xl overflow-hidden border-3 transition-all transform hover:scale-105 ${
                              selectedImageUrl === img.url
                                ? 'border-emerald-500 ring-4 ring-emerald-300 shadow-lg'
                                : 'border-gray-200 hover:border-emerald-300 shadow-md hover:shadow-xl'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={`AI ${index + 1}`}
                              className="w-full h-28 object-cover"
                            />
                            {selectedImageUrl === img.url && (
                              <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-emerald-500 text-white rounded-full p-2 shadow-xl transform scale-110">
                                  <CheckCircleIcon className="w-6 h-6" />
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs px-2 py-2 font-semibold">
                              ✨ AI #{index + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {/* Selected Preview */}
                      {selectedImageUrl && (
                        <div className="mt-4 p-3 bg-white rounded-xl border-2 border-emerald-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span>Ảnh sẽ gửi cho Admin:</span>
                          </p>
                          <img
                            src={selectedImageUrl}
                            alt="Selected"
                            className="rounded-lg border-2 border-emerald-300 shadow-md w-full object-cover max-h-48"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fallback */}
                  {aiGeneratedImages.length === 0 && productPreviewUrl && (
                    <img
                      src={productPreviewUrl}
                      alt={productName}
                      className="mt-3 rounded-xl border-2 border-emerald-300 shadow-md w-full object-cover max-h-48"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Contact Information */}
          <div className="relative">
            <div className="absolute -left-2 top-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
              2
            </div>
            <div className="ml-8 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                <span className="text-2xl">👤</span>
                <span>Thông tin liên hệ</span>
              </h3>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên của bạn *</label>
                <input
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base"
                  placeholder="Nhập tên đầy đủ của bạn"
                />
              </div>

              {/* Contact Method */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Cách liên hệ ưu tiên *</label>
                <div className="grid gap-3">
                  {CONTACT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = formData.preferredContact === method.value;
                    return (
                      <label
                        key={method.value}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-md ring-4 ring-blue-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md'
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferredContact"
                          value={method.value}
                          checked={isSelected}
                          onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 ${
                          isSelected ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <span className={`font-bold text-base block ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {method.label}
                          </span>
                          <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                            {method.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Details */}
              {selectedMethod && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{selectedMethod.label} *</label>
                  <input
                    value={formData[formData.preferredContact] || ''}
                    onChange={(e) => handleInputChange(formData.preferredContact, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base"
                    placeholder={selectedMethod.placeholder}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú thêm (không bắt buộc)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base"
                  placeholder="Thời gian thuận tiện liên hệ, yêu cầu đặc biệt..."
                />
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="text-3xl flex-shrink-0">💡</span>
              <div className="text-sm text-gray-700">
                <p className="font-bold mb-1 text-base">Lưu ý:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Admin sẽ liên hệ bạn trong vòng 24 giờ</li>
                  <li>Hãy đảm bảo thông tin liên hệ chính xác</li>
                  <li>Bạn có thể chọn ảnh thiết kế AI ưng ý nhất</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t-2 border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.customerName?.trim()}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <ChatBubbleLeftRightIcon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Gửi yêu cầu ngay</span>
                  <span className="text-lg relative z-10">🚀</span>
                </>
              )}
            </button>
          </div>
          
          {/* Quick Info */}
          <div className="mt-3 text-center text-xs text-gray-500">
            <span className="inline-flex items-center space-x-1">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span>Miễn phí tư vấn • Phản hồi trong 24h</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
