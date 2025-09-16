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
      image: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758019463/anh_1_pvdv5o.png'
    },
    {
      id: 2,
      image: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758019475/anh_2_ictpzz.jpg'
    },
    {
      id: 3,
      image: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758019483/anh_3_yictue.jpg'
    },
    {
      id: 4,
      image: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758019488/anh_4_lzlznp.jpg'
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
    <section className="relative w-full h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden bg-gray-100">
      {/* Background Image Container */}
      <div className="relative w-full h-full">
        {/* Image with smooth transition */}
        <div className="absolute inset-0">
          <img
            src={slides[currentSlide].image}
            alt={`GreenWeave slide ${currentSlide + 1}`}
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out transform hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/1920x1080/22c55e/ffffff?text=GreenWeave';
            }}
          />
        </div>
        
        {/* Light Overlay for button visibility */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Content Overlay */}
       
      </div>

      {/* Navigation Arrow - Left */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronRightIcon className="h-6 w-6 text-white rotate-180" />
      </button>

      {/* Navigation Arrow - Right */}
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-6 w-6 text-white" />
      </button>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'w-8 h-4 bg-white shadow-lg'
                : 'w-4 h-4 bg-white/60 hover:bg-white/80 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-5000 ease-linear"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        ></div>
      </div>
    </section>
  );
};

export default HeroSection;
