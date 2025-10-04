import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Blog } from '../types/blog';
import { blogService } from '../services/blogService';
import BlogList from '../components/blog/BlogList';
import BlogSearch from '../components/blog/BlogSearch';
import Header from '../components/layout/Header';
import { 
  NewspaperIcon,
  FireIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [popularBlogs, setPopularBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [blogsData, categoriesData, recentData, popularData] = await Promise.all([
        blogService.getPublishedBlogs(),
        blogService.getCategories(),
        blogService.getRecentBlogs(5),
        blogService.getPopularBlogs(5)
      ]);
      
      setBlogs(blogsData);
      setCategories(categoriesData);
      setRecentBlogs(recentData);
      setPopularBlogs(popularData);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (searchBlogs: Blog[]) => {
    setBlogs(searchBlogs);
    setSelectedCategory(''); // Clear category filter when searching
  };

  const handleSearchClear = () => {
    loadInitialData();
  };

  const handleCategoryFilter = async (category: string) => {
    if (category === selectedCategory || !category.trim()) {
      setSelectedCategory('');
      await loadInitialData();
      return;
    }

    setSelectedCategory(category);
    setLoading(true);
    
    try {
      const categoryBlogs = await blogService.getBlogsByCategory(category);
      setBlogs(categoryBlogs);
    } catch (error) {
      console.error('Error loading category blogs:', error);
      // Fallback to initial data if category filter fails
      await loadInitialData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
    
      <div className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full mr-4">
                <NewspaperIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Blog GreenWeave</h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Khám phá thế giới thời trang bền vững, hướng dẫn sử dụng sản phẩm và những câu chuyện ý nghĩa về môi trường
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Search - Top */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tìm kiếm</h3>
            <BlogSearch
              onSearchResults={handleSearchResults}
              onSearching={setSearching}
              onClear={handleSearchClear}
              placeholder="Tìm kiếm bài viết..."
            />
            {searching && (
              <div className="mt-3 text-sm text-gray-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tìm kiếm...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Left (Desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tìm kiếm</h3>
                <BlogSearch
                  onSearchResults={handleSearchResults}
                  onSearching={setSearching}
                  onClear={handleSearchClear}
                  placeholder="Tìm kiếm bài viết..."
                />
                {searching && (
                  <div className="mt-3 text-sm text-gray-500 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tìm kiếm...
                  </div>
                )}
              </div>

              {/* Categories Filter */}
              {categories.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCategoryFilter('')}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === ''
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile Categories Filter */}
            {categories.length > 0 && (
              <div className="lg:hidden mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCategoryFilter('')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === ''
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Blog List */}
            <BlogList
              blogs={blogs}
              loading={loading || searching}
              showAuthor={true}
              showStatus={false}
              emptyMessage={selectedCategory ? `Không có bài viết nào trong danh mục "${selectedCategory}"` : "Không có bài viết nào"}
            />
          </div>

          {/* Sidebar - Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Recent Posts */}
              {recentBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <ClockIcon className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Bài viết gần đây</h3>
                  </div>
                  <div className="space-y-4">
                    {recentBlogs.map((blog) => (
                      <Link
                        key={blog.id}
                        to={`/blog/${blog.slug}`}
                        className="block group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 group-hover:text-green-600 line-clamp-2 mb-1">
                          {blog.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {blogService.formatDate(blog.publishedAt || blog.createdAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Posts */}
              {popularBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <FireIcon className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Bài viết phổ biến</h3>
                  </div>
                  <div className="space-y-4">
                    {popularBlogs.map((blog, index) => (
                      <Link
                        key={blog.id}
                        to={`/blog/${blog.slug}`}
                        className="block group hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <div className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-green-600 line-clamp-2 mb-1">
                              {blog.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{blog.viewCount} lượt xem</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
