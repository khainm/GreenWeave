import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    if (!orderNumber) {
      setError('Không tìm thấy thông tin đơn hàng');
      setLoading(false);
      return;
    }

    loadOrderDetails();
  }, [orderNumber]);

  const loadOrderDetails = async () => {
    if (!orderNumber) return;

    try {
      setLoading(true);
      // Tìm đơn hàng theo orderNumber - cần implement getOrderByNumber hoặc search
      // Tạm thời redirect về trang đơn hàng của tôi
      console.log('Payment successful for order:', orderNumber);
    } catch (err) {
      console.error('Error loading order details:', err);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="animate-pulse text-center">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán thành công!
          </h1>
          
          <p className="text-gray-600 mb-4">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>

          {/* Auto-processing notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-800 mb-2">Đơn hàng đã được xử lý tự động:</p>
                <ul className="space-y-1.5 text-green-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Xác nhận đơn hàng
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Tạo vận đơn ViettelPost
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Gửi email thông báo
                  </li>
                </ul>
                <p className="mt-3 text-xs text-green-600 bg-green-100 px-2 py-1 rounded inline-block">
                  💌 Kiểm tra email để nhận mã tracking theo dõi đơn hàng
                </p>
              </div>
            </div>
          </div>

          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Mã đơn hàng</p>
              <p className="font-semibold text-gray-900">{orderNumber}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Xem đơn hàng của tôi
            </button>
            
            <button
              onClick={() => navigate('/products')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;