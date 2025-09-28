import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { CreateBlogRequest, UpdateBlogRequest, Blog } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { 
  ArrowLeftIcon,
  PhotoIcon,
  TagIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AdminBlogFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CreateBlogRequest>({
    title: '',
    excerpt: '',
    content: '',
    featuredImageUrl: '',
    featuredImageAlt: '',
    status: 'draft',
    tags: '',
    category: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      loadBlog();
    }
  }, [isEdit, id]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const blog = await blogService.getBlogById(parseInt(id!));
      setFormData({
        title: blog.title,
        excerpt: blog.excerpt || '',
        content: blog.content,
        featuredImageUrl: blog.featuredImageUrl || '',
        featuredImageAlt: blog.featuredImageAlt || '',
        status: blog.status,
        tags: blog.tags || '',
        category: blog.category || '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        metaKeywords: blog.metaKeywords || ''
      });
    } catch (error) {
      console.error('Error loading blog:', error);
      navigate('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
    }

    if (formData.status === 'published' && !formData.excerpt?.trim()) {
      newErrors.excerpt = 'Mô tả ngắn là bắt buộc khi xuất bản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      if (isEdit) {
        await blogService.updateBlog(parseInt(id!), formData as UpdateBlogRequest);
      } else {
        await blogService.createBlog(formData);
      }
      
      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const draftData = { ...formData, status: 'draft' as const };
    
    try {
      setSaving(true);
      
      if (isEdit) {
        await blogService.updateBlog(parseInt(id!), draftData as UpdateBlogRequest);
      } else {
        await blogService.createBlog(draftData);
      }
      
      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Có lỗi xảy ra khi lưu bản nháp');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/blog')}
                className="mr-4 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {isEdit ? 'Cập nhật thông tin bài viết' : 'Viết nội dung blog mới cho website'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Thông tin cơ bản
                </h2>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề bài viết *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập tiêu đề bài viết..."
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả ngắn
                    </label>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.excerpt ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mô tả ngắn về bài viết..."
                    />
                    {errors.excerpt && (
                      <p className="text-red-500 text-sm mt-1">{errors.excerpt}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung bài viết *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={15}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.content ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Viết nội dung bài viết của bạn..."
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Bạn có thể sử dụng HTML để định dạng nội dung
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewMode && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Xem trước</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Preview Mode
                    </span>
                  </div>
                  <div className="prose max-w-none">
                    {/* Featured Image */}
                    {formData.featuredImageUrl && (
                      <div className="mb-6">
                        <img
                          src={formData.featuredImageUrl}
                          alt={formData.featuredImageAlt || formData.title}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title || 'Tiêu đề bài viết'}</h1>
                    
                    {/* Excerpt */}
                    {formData.excerpt && (
                      <p className="text-xl text-gray-600 mb-6">{formData.excerpt}</p>
                    )}
                    
                    {/* Content */}
                    <div 
                      className="min-h-[200px] p-4 border border-gray-200 rounded-lg bg-gray-50"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.content || '<p class="text-gray-500 italic">Nội dung bài viết sẽ hiển thị ở đây...</p>' 
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái & Hành động</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="published">Đã xuất bản</option>
                      <option value="archived">Đã lưu trữ</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu bài viết'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Ảnh đại diện
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL ảnh
                    </label>
                    <input
                      type="url"
                      name="featuredImageUrl"
                      value={formData.featuredImageUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt text
                    </label>
                    <input
                      type="text"
                      name="featuredImageAlt"
                      value={formData.featuredImageAlt}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Mô tả ảnh..."
                    />
                  </div>

                  {formData.featuredImageUrl && (
                    <div className="mt-4">
                      <img
                        src={formData.featuredImageUrl}
                        alt={formData.featuredImageAlt || formData.title}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tags & Category */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TagIcon className="w-5 h-5 mr-2" />
                  Phân loại
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ví dụ: Thời trang, Môi trường..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="túi, môi trường, thời trang..."
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tiêu đề SEO..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Mô tả SEO..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      name="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="từ khóa, phân cách, bằng dấu phẩy..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBlogFormPage;
