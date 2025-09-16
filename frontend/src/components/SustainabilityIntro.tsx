import React from 'react';

const SustainabilityIntro: React.FC = () => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-green-700">
          Thời trang bền vững cho thế hệ trẻ năng động
        </h2>
        <div className="mt-4 h-px bg-gray-200 w-11/12 mx-auto" />
        <p className="mt-6 text-center text-base md:text-lg text-gray-600 leading-8 max-w-3xl mx-auto">
          GreenWeave là dự án khởi nghiệp thời trang xanh, mang đến những
          sản phẩm bền vững, trẻ trung và cá tính, truyền cảm hứng sống xanh
          cho thế hệ GenZ – cùng xem nhé...
        </p>

        <div className="mt-10 md:mt-12">
          <div className="relative w-full overflow-hidden rounded-xl shadow-sm">
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilityIntro;


