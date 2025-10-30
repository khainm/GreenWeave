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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* 🌄 Full background image */}
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

      {/* 🧊 Glass Form */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-6xl px-6 md:px-10">

        {/* LEFT FORM */}
        <div className="w-full md:w-1/2 bg-white/70 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8 transition-all duration-300">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-green-700 drop-shadow-sm">Chào mừng trở lại!</h2>
            <p className="mt-1 text-gray-600">
              Đăng nhập để tiếp tục cùng <span className="font-semibold text-green-600">Greenweave</span>
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {showResendVerification && (
            <ResendVerificationEmail
              email={formData.email}
              onSuccess={(msg) => {
                setMessage(msg);
                setShowResendVerification(false);
              }}
              onError={(err) => setErrors([err])}
            />
          )}

          {/* FORM */}
          <form className="space-y-6" onSubmit={handleSubmit}>
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span>Lưu mật khẩu</span>
              </label>
              <Link to="/forgot-password" className="text-green-600 hover:text-green-500 font-medium">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-gray-700">
              Bạn chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                Đăng ký ngay
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

export default LoginPage;
