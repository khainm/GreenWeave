import React, { useState, useEffect } from 'react';

const HeroBanner: React.FC = () => {
  const images = [
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046337/ghts_180_qparol.jpg',
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046350/ghts_242_w6wsap.jpg',
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046359/ghts_335_beclzg.jpg',
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046369/ghts_349_b9qafp.jpg',
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046378/ghts_420_eedg01.jpg',
    'https://res.cloudinary.com/djatlz4as/image/upload/v1758046387/ghts_455_panydx.jpg'
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Slide container */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 bg-cover bg-center relative"
            style={{ backgroundImage: `url('${image}')` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full border border-gray-300 flex items-center justify-center transition-all duration-200"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full border border-gray-300 flex items-center justify-center transition-all duration-200"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Thời Trang Bền Vững
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed drop-shadow-md">
            Khám phá những sản phẩm thời trang được chế tạo từ vật liệu tái chế, thân thiện với môi trường và đầy phong cách.
          </p>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'bg-white'
                : 'bg-white/50 border border-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
