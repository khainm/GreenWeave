import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const ShowroomSection: React.FC = () => {
  const amenities = [
    {
      icon: () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      text: 'Bãi đỗ xe miễn phí',
      color: 'text-red-500'
    },
    {
      icon: () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      ),
      text: 'Không gian xanh',
      color: 'text-green-500'
    },
    {
      icon: () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 13H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V6h12v2z"/>
        </svg>
      ),
      text: 'Café organic',
      color: 'text-amber-600'
    }
  ];

  return (
    <section className="w-full bg-green-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
            Ghé thăm showroom của chúng tôi
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Trải nghiệm trực tiếp các sản phẩm bền vững tại không gian xanh của GreenWeave
          </p>
        </div>

        {/* Showroom Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {/* Map Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MapPinIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {/* Card Title */}
            <h3 className="text-2xl font-bold text-green-700 text-center mb-6">
              Vị trí showroom
            </h3>

            {/* Address */}
            <div className="text-center mb-8">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Khu Đô Thị Mới An Phú Thịnh
              </p>
              <p className="text-gray-600">
                Nhơn Bình, Quy Nhơn
              </p>
            </div>

            {/* Amenities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {amenities.map((amenity, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${amenity.color.replace('text-', 'bg-').replace('-500', '-100').replace('-600', '-100')}`}>
                    <amenity.icon />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {amenity.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Directions Button */}
            <div className="text-center">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 mx-auto shadow-lg">
                <MapPinIcon className="w-5 h-5" />
                <span>Chỉ đường</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowroomSection;
