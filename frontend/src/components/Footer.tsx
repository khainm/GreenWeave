import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gradient-to-br from-green-800 to-green-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold text-xl">G</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Greenweave</h3>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Thời trang bền vững cho tương lai xanh. Chúng tôi tạo ra các sản phẩm thời trang từ vật liệu tái chế thân thiện với môi trường.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Sản phẩm</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Danh mục</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Mũ nón</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Áo phông</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Balo</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Túi tote</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Liên hệ</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-white/80 mr-3 mt-1">📍</span>
                <p className="text-white/80 text-sm">
                  Khu Đô Thị Mới An Phú Thịnh,<br />
                  Nhơn Bình, Quy Nhơn
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-white/80 mr-3">📞</span>
                <a href="tel:+84123456789" className="text-white/80 hover:text-white transition-colors text-sm">
                  +84 123 456 789
                </a>
              </div>
              <div className="flex items-center">
                <span className="text-white/80 mr-3">✉️</span>
                <a href="mailto:info@greenweave.com" className="text-white/80 hover:text-white transition-colors text-sm">
                  info@greenweave.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              ©2024 Greenweave. Tất cả quyền được bảo lưu.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-white text-sm font-bold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-white text-sm">🐦</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-white text-sm">📷</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="text-white text-sm font-bold">in</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
