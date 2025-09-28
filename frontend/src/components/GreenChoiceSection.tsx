import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';
import type { Blog } from '../types/blog';

const GreenChoiceSection: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBlogs();
  }, []);

  const loadRecentBlogs = async () => {
    try {
      setLoading(true);
      const recentBlogs = await blogService.getRecentBlogs(3);
      setBlogs(recentBlogs);
    } catch (error) {
      console.error('Error loading recent blogs:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {loading ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <div key={index} className="rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100 animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200"></div>
                  <div className="p-5">
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : blogs.length > 0 ? (
              blogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="group rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {blog.featuredImageUrl ? (
                      <img
                        src={blog.featuredImageUrl}
                        alt={blog.featuredImageAlt || blog.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Không có ảnh</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {blogService.formatDate(blog.publishedAt || blog.createdAt)}
                    </p>
                    <h5 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-green-700 line-clamp-2">
                      {blog.title}
                    </h5>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {blog.excerpt || 'Không có mô tả'}
                    </p>
                    <span className="mt-3 inline-flex items-center text-green-700 text-sm font-medium">
                      Đọc tiếp
                      <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">Chưa có bài viết nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>


  );
};

export default GreenChoiceSection;


