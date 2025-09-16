import React from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';

const ContactInfoSection: React.FC = () => {
  const contactMethods = [
    {
      icon: MapPinIcon,
      title: 'Địa chỉ',
      content: 'Quy Nhơn, Bình Định',
      iconColor: 'text-red-500'
    },
    {
      icon: PhoneIcon,
      title: 'Điện thoại',
      content: '097 610 6769',
      iconColor: 'text-gray-600',
      hasBorder: true
    },
    {
      icon: EnvelopeIcon,
      title: 'Email',
      content: 'info.greenweave@gmail.com',
      iconColor: 'text-gray-400'
    },
    {
      icon: ClockIcon,
      title: 'Giờ làm việc',
      content: 'Thứ 2 đến thứ 7 8:00am - 18:00pm',
      iconColor: 'text-gray-400'
    }
  ];

  return (
    <section className="w-full bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
            Thông tin liên hệ
          </h2>
          <p className="text-lg text-gray-600">
            Nhiều cách để bạn có thể kết nối với chúng tôi
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {contactMethods.map((method, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                method.hasBorder ? 'border-b-4 border-teal-300' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 ${method.iconColor}`}>
                  <method.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {method.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactInfoSection;
