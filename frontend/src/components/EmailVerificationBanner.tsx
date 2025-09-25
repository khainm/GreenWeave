import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { emailVerificationService } from '../services/emailVerificationService';

interface EmailVerificationBannerProps {
  userEmail: string;
  onDismiss?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ 
  userEmail, 
  onDismiss 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const result = await emailVerificationService.resendVerificationEmail(userEmail);
      if (result.success) {
        // Show success message
        console.log('Email verification sent successfully');
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <EnvelopeIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Email chưa được xác thực
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Để sử dụng đầy đủ các chức năng như mua hàng, thanh toán, 
                  vui lòng xác thực email của bạn.
                </p>
                <div className="mt-3 flex space-x-3">
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Xác thực ngay
                  </Link>
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-yellow-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi lại email'
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
