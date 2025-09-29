import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Blog } from '../../types/blog';
import { blogService } from '../../services/blogService';
import TopNav from '../../components/admin/TopNav';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AdminBlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadBlogs();
  }, [statusFilter]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      let blogsData: Blog[];
      
      if (statusFilter) {
        blogsData = await blogService.getBlogsByStatus(statusFilter);
      } else {
        blogsData = await blogService.getAllBlogs();
      }
      
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadBlogs();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await blogService.searchBlogs(searchTerm);
      setBlogs(searchResults);
    } catch (error) {
      console.error('Error searching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      setDeletingId(id);
      await blogService.deleteBlog(id);
      setBlogs(blogs.filter(blog => blog.id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Có lỗi xảy ra khi xóa bài viết');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    if (!searchTerm) return true;
    return blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           blog.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Blog</h1>
              <p className="text-gray-600 mt-2">Tạo và quản lý nội dung blog của bạn</p>
            </div>
            <Link
              to="/admin/blog/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Tạo bài viết mới
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có bài viết nào</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Không tìm thấy bài viết phù hợp với từ khóa tìm kiếm' : 'Hãy tạo bài viết đầu tiên của bạn'}
              </p>
              <Link
                to="/admin/blog/create"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Tạo bài viết mới
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bài viết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tác giả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thống kê
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {blog.featuredImageUrl && (
                            <img
                              src={blog.featuredImageUrl}
                              alt={blog.featuredImageAlt || blog.title}
                              className="w-16 h-16 object-cover rounded-lg mr-4"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {blog.title}
                            </h3>
                            {blog.excerpt && (
                              <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                {blog.excerpt}
                              </p>
                            )}
                            {blog.category && (
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {blog.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${blogService.getStatusColor(blog.status)}`}>
                          {blogService.getStatusText(blog.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {blog.authorName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {blogService.formatDateTime(blog.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            <span>{blog.viewCount}</span>
                          </div>
                          <div className="flex items-center">
                            <span>❤️ {blog.likeCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/blog/${blog.slug}`}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Xem bài viết"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/blog/edit/${blog.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            disabled={deletingId === blog.id}
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            title="Xóa bài viết"
                          >
                            {deletingId === blog.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogPage;
