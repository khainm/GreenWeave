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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">

      {/* 🌄 Background with Parallax Feel */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/djatlz4as/image/upload/v1761800899/BackgroundRegister_z2i3pn.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent backdrop-blur-[2px]" />
      </div>

      {/* ✨ Floating Orbs for Premium Feel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-500/30 rounded-full blur-[128px] animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }} />

      {/* ✅ SUCCESS MODAL - Premium Glass Style */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-white/50 animate-bounce-in relative overflow-hidden">

            {/* Decorative background blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-400/30 rounded-full blur-3xl" />

            {/* Success Icon */}
            <div className="flex justify-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-inner border border-white">
                <svg className="w-10 h-10 text-green-600 animate-scale-up" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công! 🎉</h3>
              <p className="text-gray-600">Tài khoản của bạn đã được tạo.</p>
            </div>

            {/* Email Notice */}
            <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-xl relative z-10">
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Email xác thực đã gửi đến:</p>
                  <p className="font-mono bg-white/80 px-2 py-1 rounded text-blue-900 border border-blue-100">{formData.email}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50/80 border border-yellow-100 rounded-xl p-4 relative z-10">
              <p className="text-sm text-yellow-800 font-bold mb-2 flex items-center gap-2">
                <span>📧</span> Hướng dẫn kích hoạt:
              </p>
              <ol className="text-sm text-yellow-800/90 space-y-1.5 ml-5 list-decimal marker:font-semibold">
                <li>Kiểm tra hộp thư đến</li>
                <li>Tìm email từ <strong>GreenWeave</strong></li>
                <li>Click vào link xác thực</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 relative z-10 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Đi đến trang Đăng nhập
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full transition-all duration-300 border border-white/10 hover:border-white/30 group"
      >
        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Trang chủ</span>
      </button>

      {/* 🧊 Main Glass Card */}
      <div className="relative z-10 w-full max-w-6xl mx-4 h-[85vh] md:h-[700px] flex flex-col md:flex-row bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 animate-fade-in-up">

        {/* 📝 LEFT SIDE - FORM */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col relative overflow-y-auto custom-scrollbar">

          <div className="mb-6 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản 🌿</h2>
            <p className="text-gray-500">Tham gia cộng đồng thời trang bền vững.</p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-shake">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold text-sm mb-1">Đăng ký thất bại:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 pb-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Họ và tên *</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email *</label>
                <div className="relative group">
                  <EnvelopeIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Số điện thoại</label>
                <div className="relative group">
                  <PhoneIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="0912 345 678"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* DOB & Address Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Ngày sinh</label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Địa chỉ</label>
                <div className="relative group">
                  <MapPinIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Hà Nội, Việt Nam"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu *</label>
              <div className="relative group">
                <LockClosedIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-gray-600">
                <p className="font-bold text-blue-700 mb-1.5">Yêu cầu bảo mật:</p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 list-disc ml-4">
                  <li>Tối thiểu <strong>9 ký tự</strong></li>
                  <li>Có chữ <strong>HOA</strong> (A-Z)</li>
                  <li>Có chữ <strong>thường</strong> (a-z)</li>
                  <li>Có <strong>số</strong> (0-9)</li>
                  <li className="col-span-2">Có <strong>ký tự đặc biệt</strong> (@, !, #, $, %, &, *...)</li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Xác nhận mật khẩu *</label>
              <div className="relative group">
                <LockClosedIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none placeholder:text-gray-400 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-2">
              <div className="relative flex items-center mt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="peer h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <Link to="/terms" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Tạo tài khoản ngay'
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 pt-2">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>

        {/* 🖼️ RIGHT SIDE - HERO IMAGE */}
        <div className="hidden md:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-emerald-900/40 z-10 mix-blend-multiply" />
          <img
            src="https://res.cloudinary.com/djatlz4as/image/upload/v1761800899/BackgroundRegister_z2i3pn.jpg"
            alt="Hero"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-[20s]"
          />

          {/* Content Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-12 text-center bg-black/10 backdrop-blur-[2px]">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/30 animate-float" style={{ animationDelay: '1s' }}>
              <img
                src="https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png"
                alt="Logo"
                className="w-16 h-16 object-contain brightness-0 invert"
              />
            </div>
            <h3 className="text-3xl font-bold mb-4 drop-shadow-lg">Chất lượng tạo nên khác biệt</h3>
            <p className="text-lg text-white/90 font-light leading-relaxed max-w-xs drop-shadow-md">
              "Trải nghiệm mua sắm đẳng cấp với các sản phẩm được tuyển chọn kỹ lưỡng."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
