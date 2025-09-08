import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import MobileMenu from './MobileMenu';

interface HeaderProps {
  activePage?: string;
}

const Header: React.FC<HeaderProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navigationItems = [
    { id: 'home', label: 'Trang chủ', path: '/' },
    { id: 'products', label: 'Sản phẩm', path: '/products' },
    { id: 'about', label: 'Về chúng tôi', path: '/about' },
    { id: 'contact', label: 'Liên hệ', path: '/contact' }
  ];

  const activePage = location.pathname === '/' ? 'home' : location.pathname.substring(1);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/src/assets/logo-no-background.png" 
                alt="GreenWeave" 
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-bold">
                <span className="text-green-600">Green</span>
                <span className="text-gray-800">Weave</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activePage === item.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                <UserIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <Bars3Icon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
        activePage={activePage}
      />
    </>
  );
};

export default Header;
