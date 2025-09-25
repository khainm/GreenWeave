import React, { useState } from 'react';
import { emailVerificationService } from '../services/emailVerificationService';

interface ResendVerificationEmailProps {
  email: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const ResendVerificationEmail: React.FC<ResendVerificationEmailProps> = ({ 
  email, 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResent, setIsResent] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const result = await emailVerificationService.resendVerificationEmail(email);
      
      if (result.success) {
        setIsResent(true);
        onSuccess?.(result.message);
      } else {
        onError?.(result.message || 'Không thể gửi lại email xác thực');
      }
    } catch (error: any) {
      onError?.(error.message || 'Có lỗi xảy ra khi gửi lại email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isResent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Email đã được gửi lại
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Vui lòng kiểm tra hộp thư của bạn.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Email chưa được xác thực
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Vui lòng xác thực email trước khi đăng nhập.</p>
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-800 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-800" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                'Gửi lại email xác thực'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerificationEmail;
