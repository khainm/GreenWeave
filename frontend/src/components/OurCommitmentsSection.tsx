import React from 'react';

const OurCommitmentsSection: React.FC = () => {
  const commitments = [
    {
      icon: '🌱',
      title: 'Nguyên liệu xanh 100%',
      description: 'Chỉ sử dụng nguyên liệu tái chế và thân thiện với môi trường'
    },
    {
      icon: '🧪',
      title: 'Không hóa chất độc hại',
      description: 'Cam kết quy trình sản xuất an toàn, không sử dụng chất độc hại'
    },
    {
      icon: '⭐',
      title: 'Chất lượng & Dịch vụ',
      description: 'Đảm bảo chất lượng bền vững và trải nghiệm khách hàng tuyệt vời'
    }
  ];

  return (
    <section className="w-full bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1529260830199-42c24126f198?q=80&w=1000&auto=format&fit=crop"
                alt="Sustainable architecture and green buildings"
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          {/* Right: Commitments */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-8">
              Cam kết của chúng tôi
            </h2>
            
            <div className="space-y-6">
              {commitments.map((commitment, index) => (
                <div key={index} className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{commitment.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-700 mb-2">
                        {commitment.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {commitment.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurCommitmentsSection;
