import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, activePage = 'home' }) => {
  const { user, isAuthenticated, logout } = useAuth();
  
  const navigationItems = [
    { id: 'home', label: 'Trang chủ', path: '/' },
    { id: 'products', label: 'Sản phẩm', path: '/products' },
    { id: 'custom', label: 'Sản phẩm tùy chỉnh', path: '/custom' },
    { id: 'about', label: 'Về chúng tôi', path: '/about' },
    { id: 'contact', label: 'Liên hệ', path: '/contact' }
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src="/src/assets/logo-no-background.png" 
                alt="GreenWeave" 
                className="h-6 w-auto mr-2"
              />
              <span className="text-lg font-bold">
                <span className="text-green-600">Green</span>
                <span className="text-gray-800">Weave</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                      activePage === item.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-xs text-green-600 font-medium">Mã KH: {user?.customerCode}</p>
                  </div>
                </div>

                {/* User Menu Items */}
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="block w-full text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-center"
                  >
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/orders"
                    onClick={onClose}
                    className="block w-full text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-center"
                  >
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/addresses"
                    onClick={onClose}
                    className="block w-full text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-center"
                  >
                    Địa chỉ giao hàng
                  </Link>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="block w-full text-red-600 py-3 px-4 rounded-lg font-semibold hover:bg-red-50 transition-colors duration-200 text-center border border-red-200"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link 
                  to="/login" 
                  onClick={onClose}
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  onClick={onClose}
                  className="block w-full border border-green-600 text-green-600 py-3 px-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 text-center"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
