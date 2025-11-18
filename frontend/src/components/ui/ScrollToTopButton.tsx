import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px', // Đổi sang bên trái để tránh đè lên FloatingContactButtons
        backgroundColor: '#22C55E',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '52px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9998, // Thấp hơn FloatingContactButtons (9999)
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
        e.currentTarget.style.backgroundColor = '#16A34A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        e.currentTarget.style.backgroundColor = '#22C55E';
      }}
      aria-label="Scroll to top"
      title="Cuộn lên đầu trang"
    >
      <ArrowUp size={24} />
    </button>
  );
};

export default ScrollToTopButton;