import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/Footer';
import ScrollToTopButton from '../components/ui/ScrollToTopButton';
import CoreValuesSection from '../components/CoreValuesSection';
import DistinguishingFeaturesSection from '../components/DistinguishingFeaturesSection';
import CreativeTeamSection from '../components/CreativeTeamSection';
import OurCommitmentsSection from '../components/OurCommitmentsSection';
import GreenFutureSection from '../components/GreenFutureSection';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        <section className="w-full bg-green-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Visual Cards */}
              <div className="space-y-6">
                {/* Top Card - Sustainable Items */}
                <div className="relative bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="absolute top-4 left-4">
                    <div className="bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg text-center">
                      <div>100%</div>
                      <div>TÁI CHẾ</div>
                    </div>
                  </div>
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🌱</div>
                      <p className="text-gray-600 text-sm">Sustainable Fashion Items</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row - Logo and Craft Tools */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Logo Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-1">
                            <span className="text-white text-lg font-bold">W</span>
                          </div>
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-1">
                            <span className="text-white text-lg font-bold">W</span>
                          </div>
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg font-bold">W</span>
                          </div>
                        </div>
                        <h2 className="text-lg font-bold text-green-700">GreenWeave</h2>
                      </div>
                    </div>
                  </div>

                  {/* Craft Tools Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">✂️</div>
                        <p className="text-gray-600 text-xs">Craft & Production</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Text Content */}
              <div className="space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                  <span className="mr-2">🌿</span>
                  Thời trang bền vững
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-green-700">
                  About
                </h1>

                {/* Sub Heading */}
                <h2 className="text-4xl md:text-5xl font-bold text-gray-300">
                  GreenWeave
                </h2>

                {/* Content Paragraphs */}
                <div className="space-y-4 leading-relaxed">
                  <p className="text-lg font-semibold text-green-700">
                    GreenWeave là thương hiệu thời trang bền vững tiên phong trong việc tái tạo giá trị từ sợi vải tái chế.
                  </p>
                  <p className="text-base text-gray-600">
                    Chúng tôi chuyên cung cấp các sản phẩm thời trang như mũ, nón bucket, túi tote làm từ sợi vải tái chế PET, góp phần giảm thiểu ô nhiễm môi trường và lan toả lối sống xanh đến cộng đồng.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
                    Khám phá sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <CoreValuesSection />
        <DistinguishingFeaturesSection />
        <CreativeTeamSection />
        <OurCommitmentsSection />
        <GreenFutureSection />
      </main>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default AboutPage;
