import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors.length > 0) setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const response = await register(formData);
      if (response.success) {
        localStorage.setItem('pending_verification_email', formData.email);
        setShowSuccessModal(true);
        setMessage(
          'Đăng ký thành công! Email xác thực đã được gửi đến hộp thư của bạn. Vui lòng kiểm tra email và click vào link xác thực để kích hoạt tài khoản.'
        );
      } else {
        setErrors(response.errors || [response.message]);
      }
    } catch (error: any) {
      setErrors(['Đã xảy ra lỗi khi đăng ký']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* 🌄 FULL BACKGROUND IMAGE */}
      <div className="absolute inset-0">
        <img
          src="https://res.cloudinary.com/djatlz4as/image/upload/v1761800899/BackgroundRegister_z2i3pn.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* ✅ SUCCESS MODAL - Email Verification Notice */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 space-y-6 animate-fade-in">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công! 🎉</h3>
              <p className="text-gray-600">Vui lòng xác nhận email để kích hoạt tài khoản</p>
            </div>

            {/* Email Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <EnvelopeIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Email xác thực đã được gửi đến:</p>
                  <p className="text-blue-900 font-mono bg-white px-2 py-1 rounded">{formData.email}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold mb-2">📧 Hướng dẫn kích hoạt:</p>
              <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
                <li>Mở hộp thư email của bạn</li>
                <li>Tìm email từ <strong>GreenWeave</strong></li>
                <li>Click vào link xác thực trong email</li>
                <li>Quay lại đăng nhập sau khi xác thực</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                Không thấy email? Kiểm tra <strong>thư mục Spam/Junk</strong> hoặc{' '}
                <Link to="/resend-verification" className="text-green-600 hover:text-green-500 font-semibold">
                  gửi lại email xác thực
                </Link>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Đi đến trang Đăng nhập
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Quay lại Trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔙 Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-800 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full shadow-md hover:bg-white/90 hover:shadow-lg transition-all duration-200 z-20"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Quay lại Trang chủ</span>
      </button>

      {/* 💡 Centered Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-6xl px-6 md:px-10">

        {/* LEFT FORM */}
        <div className="w-full md:w-1/2 bg-white/70 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-green-700 drop-shadow-sm">Tạo tài khoản</h2>
            <p className="mt-1 text-gray-600">
              Bắt đầu hành trình cùng{' '}
              <span className="font-semibold text-green-600">Greenweave</span>!
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập họ và tên"
                  className="w-full pl-10 pr-3 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập email của bạn"
                  className="w-full pl-10 pr-3 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full pl-10 pr-3 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ"
                  className="w-full pl-10 pr-3 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu *</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-12 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {/* Password Requirements */}
              <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-semibold text-blue-700 mb-1">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Tối thiểu <strong>9 ký tự</strong></li>
                  <li>Có chữ <strong>HOA</strong> (A-Z)</li>
                  <li>Có chữ <strong>thường</strong> (a-z)</li>
                  <li>Có <strong>số</strong> (0-9)</li>
                  <li>Có <strong>ký tự đặc biệt</strong> (@, !, #, $, %, &, *...)</li>
                </ul>
                {/* <p className="mt-2 text-blue-600 italic">Ví dụ: <code className="bg-white px-1 py-0.5 rounded">123123@Aa</code> hoặc <code className="bg-white px-1 py-0.5 rounded">Admin@123</code></p> */}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu *</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-12 py-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                Tôi đồng ý với{' '}
                <Link to="/terms" className="text-green-600 font-medium hover:text-green-500">
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-green-600 font-medium hover:text-green-500">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Đăng ký thất bại:</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc ml-4">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-700">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>

        {/* RIGHT SIDE - LOGO */}
        <div className="hidden md:flex w-1/2 items-center justify-center relative">
          <div className="absolute w-80 h-80 bg-white/40 blur-3xl rounded-full animate-pulse" />
          <img
            src="https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png"
            alt="Greenweave"
            className="relative w-72 opacity-95 drop-shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
