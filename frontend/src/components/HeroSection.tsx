import React, { useState, useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface HeroSlide {
  id: number;
  image: string;
  title?: string;
  description?: string;
}

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides: HeroSlide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: 'Sản phẩm tươi ngon',
      description: 'Khám phá những sản phẩm organic chất lượng cao'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Thực phẩm hữu cơ',
      description: 'Cam kết mang đến những sản phẩm tốt nhất cho sức khỏe'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Nông sản sạch',
      description: 'Từ trang trại đến bàn ăn của bạn'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Giao hàng tận nơi',
      description: 'Dịch vụ giao hàng nhanh chóng và tiện lợi'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Chất lượng đảm bảo',
      description: 'Sản phẩm được kiểm định nghiêm ngặt'
    }
  ];

  // Auto slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {slides[currentSlide].description}
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
              Khám phá ngay
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-6 w-6 text-white" />
      </button>

      {/* Carousel Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'bg-white'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
