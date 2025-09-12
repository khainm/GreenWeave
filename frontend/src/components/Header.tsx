import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCartIcon, Bars3Icon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import MobileMenu from './MobileMenu';
import { CartService, getCartId, getOrCreateCartId } from '../services/cartService';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activePage?: string;
}

const Header: React.FC<HeaderProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const [cartCount, setCartCount] = useState<number>(0);
  const { user, isAuthenticated, logout } = useAuth();

  // Initialize cart id and fetch count
  useEffect(() => {
    const init = async () => {
      try {
        const id = getCartId() || await getOrCreateCartId();
        const cart = await CartService.get(id);
        setCartCount(cart.items?.reduce((s, i) => s + i.quantity, 0) || 0);
      } catch {
        // ignore silently
      }
    };
    init();
  }, []);

  useEffect(() => {
    const onUpdated = async () => {
      try {
        const id = getCartId();
        if (!id) return;
        const cart = await CartService.get(id);
        setCartCount(cart.items?.reduce((s, i) => s + i.quantity, 0) || 0);
      } catch {}
    };
    window.addEventListener('cart:updated', onUpdated as EventListener);
    return () => window.removeEventListener('cart:updated', onUpdated as EventListener);
  }, []);
  
  const navigationItems = [
    { id: 'home', label: 'Trang chủ', path: '/' },
    { id: 'products', label: 'Sản phẩm', path: '/products' },
    { id: 'custom', label: 'Sản phẩm tùy chỉnh', path: '/custom' },
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

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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
              <Link to="/cart" className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-green-600 text-white rounded-full px-1.5 py-0.5">{cartCount}</span>
                )}
              </Link>
              
              {isAuthenticated ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user?.fullName || 'User'}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-green-600 font-medium">Mã KH: {user?.customerCode}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Thông tin cá nhân
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/addresses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Địa chỉ giao hàng
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <Link to="/cart" className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-green-600 text-white rounded-full px-1.5 py-0.5">{cartCount}</span>
                )}
              </Link>
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
