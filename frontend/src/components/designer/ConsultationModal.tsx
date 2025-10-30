// 🌿 Premium Consultation Modal Component (Scroll-Fixed v2)
// Fix: textarea scrollable, footer không che nội dung

import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { ContactInfo, ContactFormErrors } from './types';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactInfo: ContactInfo) => Promise<void>;
  isSubmitting: boolean;
  productPreviewUrl?: string;
  productName: string;
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
        await onSubmit(formData);
        setFormData({ preferredContact: 'phone', customerName: '', phone: '', zalo: '', facebook: '', notes: '' });
        setErrors({});
        onClose();
      } catch (err) {
        console.error('Consultation submission failed:', err);
      }
    },
    [formData, validateForm, onSubmit, onClose]
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
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-1">Yêu cầu tư vấn</h2>
          <p className="text-green-100 text-sm">Chúng tôi sẽ liên hệ với bạn trong 24h</p>
        </div>

        {/* Body scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Sản phẩm được chọn</h3>
                <p className="text-gray-800 font-medium">{productName}</p>
                {productPreviewUrl && (
                  <img
                    src={productPreviewUrl}
                    alt={productName}
                    className="mt-3 rounded-lg border border-green-200 shadow-sm w-full object-cover max-h-48"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Tên của bạn *</label>
            <input
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:bg-green-50/30"
              placeholder="Nhập tên đầy đủ của bạn"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Cách liên hệ ưu tiên *</label>
            <div className="grid gap-3">
              {CONTACT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = formData.preferredContact === method.value;
                return (
                  <label
                    key={method.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
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
                    <Icon className={`w-6 h-6 mr-3 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <span className={`font-semibold ${isSelected ? 'text-green-900' : 'text-gray-700'}`}>
                        {method.label}
                      </span>
                      <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                        {method.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedMethod && (
            <div>
              <label className="block text-sm font-semibold text-gray-700">{selectedMethod.label} *</label>
              <input
                value={formData[formData.preferredContact] || ''}
                onChange={(e) => handleInputChange(formData.preferredContact, e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:bg-green-50/30"
                placeholder={selectedMethod.placeholder}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700">Ghi chú thêm</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 rounded-xl resize-none focus:border-green-500 focus:bg-green-50/30"
              placeholder="Thời gian thuận tiện liên hệ, yêu cầu đặc biệt..."
            />
          </div>
        </form>

        {/* Footer (flex-shrink-0 to keep bottom fixed visually but scroll works fine) */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.customerName?.trim()}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Gửi yêu cầu tư vấn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
