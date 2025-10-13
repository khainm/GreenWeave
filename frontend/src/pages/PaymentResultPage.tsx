import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrderService from '../services/orderService';
import Header from '../components/layout/Header';

const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderIdParam = params.get('orderId');
    setOrderId(orderIdParam);
    if (!orderIdParam) {
      setStatus('failed');
      setMessage('Không tìm thấy thông tin đơn hàng.');
      return;
    }
    // Gọi API kiểm tra trạng thái đơn hàng
    OrderService.getOrderById(Number(orderIdParam))
      .then(order => {
        if (order.paymentStatus === 'Paid') {
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.');
        } else {
          setStatus('failed');
          setMessage('Thanh toán chưa thành công hoặc đang chờ xác nhận.');
        }
      })
      .catch(() => {
        setStatus('failed');
        setMessage('Không tìm thấy đơn hàng hoặc có lỗi xảy ra.');
      });
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        {status === 'loading' && <p>Đang kiểm tra trạng thái thanh toán...</p>}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Thanh toán thành công</h1>
            <p className="mb-6">{message}</p>
            {orderId && (
              <button
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                onClick={() => navigate(`/orders/${orderId}`)}
              >
                Xem chi tiết đơn hàng
              </button>
            )}
          </>
        )}
        {status === 'failed' && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Thanh toán thất bại</h1>
            <p className="mb-6">{message}</p>
            <button
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
              onClick={() => navigate('/')}
            >
              Quay về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
