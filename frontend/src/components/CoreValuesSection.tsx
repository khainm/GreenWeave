import React from 'react';

const CoreValuesSection: React.FC = () => {
  const values = [
    {
      icon: '🌱',
      title: 'Bền vững',
      description: '100% nguyên liệu tái chế từ chai nhựa PET, giảm thiểu tác động môi trường'
    },
    {
      icon: '⭐',
      title: 'Chất lượng',
      description: 'Sản phẩm bền bỉ, thiết kế hiện đại, đáp ứng tiêu chuẩn quốc tế'
    },
    {
      icon: '🤝',
      title: 'Trách nhiệm',
      description: 'Cam kết với cộng đồng và hành tinh, tạo ra tác động tích cực lâu dài'
    }
  ];

  return (
    <section className="w-full bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
            Giá trị cốt lõi
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Những nguyên tắc dẫn lối cho sứ mệnh phát triển bền vững của chúng tôi
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-xl font-bold text-green-700 mb-4">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreValuesSection;
