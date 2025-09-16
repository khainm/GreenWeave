import React from 'react';
import { ShoppingBagIcon, ChatBubbleLeftRightIcon, LockClosedIcon, TruckIcon } from '@heroicons/react/24/outline';

const GreenFutureSection: React.FC = () => {
  const features = [
    {
      icon: LockClosedIcon,
      text: 'Cam kết chất lượng'
    },
    {
      icon: TruckIcon,
      text: 'Giao hàng toàn quốc'
    },
    {
      icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      text: '100% thân thiện môi trường'
    }
  ];

  return (
    <section className="w-full bg-teal-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Top Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-teal-700 border border-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            <span className="mr-2">🌿</span>
            Tương lai xanh
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Cùng tạo nên
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-300">
            tương lai xanh
          </h2>
        </div>

        {/* Description */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <p className="text-lg md:text-xl text-white leading-relaxed">
            Hãy tham gia cùng <span className="text-emerald-300 font-semibold">GreenWeave</span> trong hành trình{' '}
            <span className="text-emerald-300 font-semibold">phát triển bền vững</span> và tạo ra những giá trị thực cho cộng đồng
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
          <button className="bg-emerald-400 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center space-x-3 shadow-lg">
            <ShoppingBagIcon className="w-6 h-6 text-pink-400" />
            <span>Khám phá sản phẩm</span>
          </button>
          
          <button className="bg-transparent border-2 border-emerald-300 hover:bg-emerald-300/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span>Liên hệ với chúng tôi</span>
          </button>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-medium">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GreenFutureSection;
