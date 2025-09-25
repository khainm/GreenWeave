import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { emailVerificationService } from '../services/emailVerificationService';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const token = searchParams.get('token');
  const userId = searchParams.get('uid');

  useEffect(() => {
    if (!token || !userId) {
      setMessage('Liên kết xác thực không hợp lệ');
      setErrors(['Thiếu thông tin token hoặc user ID']);
      setIsLoading(false);
      return;
    }

    verifyEmail();
  }, [token, userId]);

  const verifyEmail = async () => {
    try {
      const result = await emailVerificationService.verifyEmail(token!, userId!);
      
      if (result.success) {
        setIsSuccess(true);
        setMessage(result.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.' 
            }
          });
        }, 3000);
      } else {
        setIsSuccess(false);
        setMessage(result.message);
        setErrors(result.errors || []);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Có lỗi xảy ra khi xác thực email');
      setErrors(['Vui lòng thử lại sau']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    // This would need the user's email, which we don't have in the URL
    // For now, redirect to login page
    navigate('/login', { 
      state: { 
        message: 'Vui lòng đăng nhập để gửi lại email xác thực' 
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Đang xác thực email...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Vui lòng đợi trong giây lát
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isSuccess ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-600" />
          )}
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSuccess ? 'Xác thực thành công!' : 'Xác thực thất bại'}
          </h2>
          
          <div className="mt-4">
            <p className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
            
            {errors.length > 0 && (
              <div className="mt-4">
                <ul className="list-disc list-inside text-sm text-red-600">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isSuccess ? (
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây...
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleResendEmail}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Gửi lại email xác thực
                </button>
                
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
