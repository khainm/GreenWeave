import React from 'react';

const CallToActionSection: React.FC = () => {
  return (
    <section className="w-full" style={{ backgroundColor: '#0a4b3e' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main CTA Content */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Sẵn Sàng Cho Phong Cách Xanh?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng thời trang bền vững và nhận ưu đãi đặc biệt
          </p>
          <button 
            className="px-8 py-4 rounded-xl text-white font-semibold text-lg transition-colors"
            style={{ backgroundColor: '#4caf50' }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4caf50'}
          >
            Mua Sắm Ngay
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">🚚</div>
            <p className="text-white font-medium">Miễn phí vận chuyển</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">🔄</div>
            <p className="text-white font-medium">Đổi trả 30 ngày</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">⭐</div>
            <p className="text-white font-medium">Bảo hành chính hãng</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
