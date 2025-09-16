import React from 'react';

const GreenChoiceSection: React.FC = () => {
  const posts = [
    {
      id: 1,
      title: 'Xu hướng thời trang xanh 2025',
      excerpt:
        'Cập nhật những chất liệu tái chế và thiết kế tối giản đang dẫn đầu xu hướng thời trang bền vững.',
      date: '16/09/2025',
      image:
        'https://images.unsplash.com/photo-1520975624745-4f7a4f35e979?q=80&w=1200&auto=format&fit=crop',
      href: '#',
    },
    {
      id: 2,
      title: 'Bí quyết phối đồ “xanh” cho Gen Z',
      excerpt:
        '5 gợi ý phối đồ vừa cá tính vừa thân thiện với môi trường cho bạn trẻ năng động.',
      date: '10/09/2025',
      image:
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
      href: '#',
    },
    {
      id: 3,
      title: 'Hành trình một chiếc áo tái chế',
      excerpt:
        'Từ chai nhựa đến sợi vải: bên trong quy trình sản xuất bền vững của GreenWeave.',
      date: '05/09/2025',
      image:
        'https://images.unsplash.com/photo-1520975922212-23b36c5b0d3a?q=80&w=1200&auto=format&fit=crop',
      href: '#',
    },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <h3 className="text-center text-2xl md:text-3xl font-semibold text-green-700">
          Chọn sống xanh cùng Green Weave…
        </h3>
        <div className="mt-6">
          <p className="text-center text-base md:text-lg text-gray-600 leading-8 max-w-4xl mx-auto">
            Với thiết kế tinh tế và chất liệu bền vững từ sợi tái chế, sản phẩm của
            Green Weave mang đến cho người dùng sự tiện lợi và phong cách,
            giúp cuộc sống trở nên thân thiện với môi trường, hiện đại và gọn gàng
            hơn…. 
          </p>
        </div>

        {/* Blog/News Section */}
        <div className="mt-12 md:mt-14">
          <div className="flex items-center justify-between mb-6">
            {/* <h4 className="text-xl md:text-2xl font-semibold text-gray-900">
              Tin tức & Blog
            </h4> */}
            {/* <a
              href="#"
              className="text-green-700 hover:text-green-800 text-sm md:text-base font-medium"
            >
              Xem tất cả
            </a> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.href}
                className="group rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{post.date}</p>
                  <h5 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-green-700 line-clamp-2">
                    {post.title}
                  </h5>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                  <span className="mt-3 inline-flex items-center text-green-700 text-sm font-medium">
                    Đọc tiếp
                    <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>


  );
};

export default GreenChoiceSection;


