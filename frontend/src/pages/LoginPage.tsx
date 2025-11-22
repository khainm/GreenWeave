import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import ResendVerificationEmail from '../components/ResendVerificationEmail';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.roles?.includes('Admin') || false;
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Message from verification page
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) setMessage(state.message);
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors.length > 0) setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const response = await login(formData.email, formData.password, formData.rememberMe);
      if (response.success) {
        const isAdmin = response.user?.roles?.includes('Admin') || false;
        navigate(isAdmin ? '/admin' : '/', { replace: true });
      } else {
        setErrors(response.errors || [response.message]);
        const isEmailVerificationError =
          response.message?.includes('xác thực') ||
          response.errors?.some(e => e.includes('xác thực')) ||
          false;
        setShowResendVerification(isEmailVerificationError);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors(['Đã xảy ra lỗi khi đăng nhập.']);
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

      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full transition-all duration-300 border border-white/10 hover:border-white/30 group"
      >
        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Trang chủ</span>
      </button>

      {/* 🧊 Main Glass Card */}
      <div className="relative z-10 w-full max-w-5xl mx-4 h-auto md:h-[600px] flex flex-col md:flex-row bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 animate-fade-in-up">

        {/* 📝 LEFT SIDE - FORM */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative overflow-y-auto custom-scrollbar">

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại! 👋</h2>
            <p className="text-gray-500">Nhập thông tin để tiếp tục hành trình xanh.</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3 animate-fade-in">
              <span className="text-xl">✨</span>
              <p className="text-sm font-medium pt-0.5">{message}</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-shake">
              <ul className="list-disc list-inside text-sm space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {showResendVerification && (
            <div className="mb-6">
              <ResendVerificationEmail
                email={formData.email}
                onSuccess={(msg) => {
                  setMessage(msg);
                  setShowResendVerification(false);
                }}
                onError={(err) => setErrors([err])}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
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

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu</label>
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
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="peer h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer transition-all"
                  />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Lưu đăng nhập</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline transition-all"
              >
                Quên mật khẩu?
              </Link>
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
                'Đăng nhập ngay'
              )}
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-600 pt-4">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                Tạo tài khoản mới
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
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-2xl border border-white/30 animate-float">
              <img
                src="https://res.cloudinary.com/djatlz4as/image/upload/v1758045314/logo-no-background_eol8gb.png"
                alt="Logo"
                className="w-16 h-16 object-contain brightness-0 invert"
              />
            </div>
            <h3 className="text-3xl font-bold mb-4 drop-shadow-lg">Thời trang bền vững</h3>
            <p className="text-lg text-white/90 font-light leading-relaxed max-w-xs drop-shadow-md">
              "Mỗi lựa chọn của bạn hôm nay đều góp phần tạo nên một tương lai xanh hơn."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
