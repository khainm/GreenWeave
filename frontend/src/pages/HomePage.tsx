import React, { useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
  const [favorites, setFavorites] = useState<number[]>([]);

  const featuredProducts = [
    {
      id: 1,
      name: 'Rau xanh organic tươi ngon',
      description: 'Rau xanh được trồng theo phương pháp hữu cơ, không sử dụng thuốc trừ sâu',
      price: 45000,
      originalPrice: 55000,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 2,
      name: 'Trái cây tươi theo mùa',
      description: 'Trái cây được hái tươi mỗi ngày, đảm bảo chất lượng và hương vị tự nhiên',
      price: 89000,
      originalPrice: 99000,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 3,
      name: 'Thảo mộc khô tự nhiên',
      description: 'Các loại thảo mộc được phơi khô tự nhiên, giữ nguyên dưỡng chất',
      price: 120000,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 4,
      name: 'Mật ong nguyên chất',
      description: 'Mật ong thu hoạch từ những vườn hoa tự nhiên, không qua xử lý',
      price: 180000,
      originalPrice: 200000,
      image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    }
  ];

  const handleToggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const handleAddToCart = (id: number) => {
    // TODO: Implement add to cart functionality
    console.log('Added to cart:', id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      
      {/* Additional sections can be added here */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Products Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sản phẩm nổi bật
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá những sản phẩm organic chất lượng cao được chọn lọc kỹ lưỡng
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Về GreenWeave
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Chúng tôi cam kết mang đến những sản phẩm organic chất lượng cao, 
                được chọn lọc kỹ lưỡng từ những trang trại uy tín. Với phương châm 
                "Sức khỏe từ thiên nhiên", GreenWeave luôn đặt chất lượng và sức khỏe 
                người tiêu dùng lên hàng đầu.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
                  <div className="text-gray-600">Sản phẩm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
                  <div className="text-gray-600">Khách hàng</div>
                </div>
              </div>
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-green-50 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Đăng ký nhận tin tức
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Nhận thông tin về sản phẩm mới, khuyến mãi đặc biệt và các mẹo 
            chăm sóc sức khỏe từ GreenWeave
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200">
              Đăng ký
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/src/assets/logo-no-background.png" 
                  alt="GreenWeave" 
                  className="h-6 w-auto mr-2"
                />
                <span className="text-xl font-bold">
                  <span className="text-green-400">Green</span>
                  <span className="text-white">Weave</span>
                </span>
              </div>
              <p className="text-gray-400">
                Mang đến những sản phẩm organic chất lượng cao cho sức khỏe của bạn.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trang chủ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sản phẩm</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách đổi trả</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vận chuyển</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bảo mật</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@greenweave.com</li>
                <li>Điện thoại: 0123 456 789</li>
                <li>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GreenWeave. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
