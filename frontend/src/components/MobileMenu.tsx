import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, activePage = 'home' }) => {
  const navigationItems = [
    { id: 'home', label: 'Trang chủ', path: '/' },
    { id: 'products', label: 'Sản phẩm', path: '/products' },
    { id: 'custom', label: 'Sản phẩm tùy chỉnh', path: '/custom' },
    { id: 'about', label: 'Về chúng tôi', path: '/about' },
    { id: 'contact', label: 'Liên hệ', path: '/contact' }
  ];

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
