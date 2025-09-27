import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DistinguishingFeaturesSection: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  
  const images = [
    {
      src: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758947085/recycled-tote-bag-3_pn0pvh.jpg',
      alt: 'Sản phẩm từ chất liệu bền vững'
    },
    {
      src: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758947330/quy-trinh-tai-che-nhua-pet-recycle-dung-cach_iypm5p.jpg',
      alt: 'Túi tote thân thiện môi trường'
    },
    {
      src: 'https://res.cloudinary.com/djatlz4as/image/upload/v1758947070/recycled-mailer-packaging-design-for-kids-clothing-brand_k4ztku.jpg',
      alt: 'Sản phẩm tái chế chất lượng cao'
    }
  ];

  const features = [
    {
      icon: '♻️',
      title: 'Công nghệ tái chế tiên tiến',
      description: 'Sử dụng sợi vải tái chế từ chai nhựa PET với công nghệ hiện đại, tạo ra vật liệu bền vững và thân thiện môi trường.'
    },
    {
      icon: '🌍',
      title: 'Quy trình sản xuất xanh',
      description: 'Tích hợp giá trị bền vững trong mỗi công đoạn sản xuất, từ nguyên liệu đến bao bì, đảm bảo tối thiểu tác động môi trường.'
    }
  ];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Features */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-8">
              Điểm khác biệt
            </h2>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-700 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image Carousel */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200">
              <img
                src={images[currentImage].src}
                alt={images[currentImage].alt}
                className="w-full h-96 object-cover"
              />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeftIcon className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {/* Image Caption */}
            <p className="text-center text-gray-600 mt-4 font-medium">
              {images[currentImage].alt}
            </p>
            
            {/* Image Indicators */}
            <div className="flex justify-center space-x-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentImage ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DistinguishingFeaturesSection;
