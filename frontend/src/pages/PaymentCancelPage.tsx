import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderNumber = searchParams.get('orderNumber');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán đã bị hủy
          </h1>
          
          <p className="text-gray-600 mb-6">
            Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn vẫn còn hiệu lực và bạn có thể thanh toán lại sau.
          </p>

          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Mã đơn hàng</p>
              <p className="font-semibold text-gray-900">{orderNumber}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/my-orders')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem đơn hàng & thanh toán lại
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

export default PaymentCancelPage;