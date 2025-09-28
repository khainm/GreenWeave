import React from 'react';
import type { Blog } from '../../types/blog';
import BlogCard from './BlogCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface BlogListProps {
  blogs: Blog[];
  loading?: boolean;
  showAuthor?: boolean;
  showStatus?: boolean;
  emptyMessage?: string;
  className?: string;
}

const BlogList: React.FC<BlogListProps> = ({
  blogs,
  loading = false,
  showAuthor = true,
  showStatus = false,
  emptyMessage = "Không có bài viết nào",
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy bài viết</h3>
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          <div className="text-sm text-gray-400">
            <p>💡 Thử tìm kiếm với từ khóa khác</p>
            <p>💡 Kiểm tra chính tả</p>
            <p>💡 Sử dụng từ khóa ngắn gọn</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          showAuthor={showAuthor}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
};

export default BlogList;
