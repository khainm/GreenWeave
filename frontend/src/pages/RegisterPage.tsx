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
