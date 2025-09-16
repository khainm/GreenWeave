import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ContactSection: React.FC = () => {
  const features = [
    {
      number: '24h',
      label: 'PHẢN HỒI NHANH'
    },
    {
      number: '100%',
      label: 'BẢO MẬT'
    },
    {
      number: '500+',
      label: 'KHÁCH HÀI LÒNG'
    }
  ];

  return (
    <section className="w-full bg-green-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Top CTA Button */}
        <div className="flex justify-center mb-8">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold text-lg transition-colors flex items-center space-x-3 shadow-lg">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>Liên hệ ngay</span>
          </button>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Kết nối với
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-400">
            GreenWeave
          </h2>
        </div>

        {/* Description */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <p className="text-lg md:text-xl text-white leading-relaxed">
            Chúng tôi luôn sẵn sàng <span className="font-bold">lắng nghe</span> và <span className="font-bold">hỗ trợ</span> bạn. Hãy chia sẻ ý kiến, góp ý hoặc thắc mắc để cùng nhau xây dựng <span className="font-bold">tương lai xanh bền vững</span>.
          </p>
        </div>

        {/* Feature Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-100 rounded-2xl p-8 text-center shadow-lg">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-4">
                {feature.number}
              </div>
              <div className="text-sm md:text-base font-bold text-gray-800 uppercase tracking-wide">
                {feature.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
