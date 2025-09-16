import React from 'react';

const AboutStorySection: React.FC = () => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: content */}
          <div>
            <h3 className="text-center lg:text-left text-3xl md:text-4xl font-semibold text-gray-900">
              Câu Chuyện GreenWeave
            </h3>
            <p className="mt-6 text-gray-600 text-base md:text-lg leading-8 text-center lg:text-left">
              Chúng tôi tin rằng thời trang không chỉ là việc trông đẹp, mà còn là việc cảm thấy
              tốt về những gì bạn mặc. Mỗi sản phẩm của GreenWeave được tạo ra với sứ mệnh bảo vệ
              hành tinh và mang lại giá trị bền vững.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-center justify-center lg:justify-start text-gray-700">
                <span className="mr-3 text-green-600 text-2xl">♻️</span>
                Vật liệu tái chế 100%
              </li>
              <li className="flex items-center justify-center lg:justify-start text-gray-700">
                <span className="mr-3 text-green-600 text-2xl">🌿</span>
                Quy trình sản xuất xanh
              </li>
              <li className="flex items-center justify-center lg:justify-start text-gray-700">
                <span className="mr-3 text-green-600 text-2xl">💚</span>
                Thương hiệu vì môi trường
              </li>
            </ul>

            <div className="mt-8 flex justify-center lg:justify-start">
              <button className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors">
                Tìm Hiểu Thêm
              </button>
            </div>
          </div>

          {/* Right: image */}
          <div className="flex justify-center lg:justify-end">
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <img
                className="w-full max-w-xl object-cover"
                src="https://res.cloudinary.com/djatlz4as/image/upload/v1758028301/IMG_4173_fvemza.jpg"
                alt="GreenWeave team"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutStorySection;


