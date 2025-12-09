import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Blog } from '../types/blog';
import { blogService } from '../services/blogService';
import Header from '../components/layout/Header';
import { sanitizeHtml } from '../utils/security';

import {
  ArrowLeftIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ShareIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    console.log('BlogDetailPage mounted with slug:', slug);
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      console.log('Loading blog with slug:', slug);
      const blogData = await blogService.getBlogBySlug(slug);
      console.log('Blog data loaded:', blogData);
      setBlog(blogData);
      setLikeCount(blogData.likeCount);

      // Check if user has liked this blog
      try {
        const likeStatus = await blogService.getLikeStatus(blogData.id);
        setLiked(likeStatus.hasLiked);
      } catch (error) {
        console.log('Could not check like status:', error);
      }

      // Load related blogs by category
      if (blogData.category) {
        try {
          const related = await blogService.getBlogsByCategory(blogData.category);
          setRelatedBlogs(related.filter(b => b.id !== blogData.id).slice(0, 3));
        } catch (error) {
          console.log('Could not load related blogs:', error);
          setRelatedBlogs([]);
        }
      }
    } catch (error) {
      console.error('Error loading blog:', error);
      console.error('Error details:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog) return;

    try {
      if (liked) {
        // Unlike the blog
        await blogService.unlikeBlog(blog.id);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like the blog
        await blogService.likeBlog(blog.id);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking/unliking blog:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link đã được sao chép!');
    }
  };

  if (loading) {
    console.log('BlogDetailPage is loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-pulse">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-6"></div>
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-6 bg-gray-200 rounded mb-3 w-5/6"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    console.log('BlogDetailPage: No blog data found');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <BookOpenIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Không tìm thấy bài viết</h2>
          <p className="text-gray-600 mb-6 text-lg">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Quay lại blog
          </Link>
        </div>
      </div>
    );
  }

  const tags = blogService.extractTags(blog.tags);

  // Helper function to format blog content with proper paragraph breaks
  const formatBlogContent = (content: string): string => {
    // If content already has proper HTML tags, return as is
    if (content.includes('<p>') && content.split('<p>').length > 3) {
      return content;
    }

    let formatted = content;

    // Remove existing paragraph tags if any
    formatted = formatted.replace(/<\/?p>/g, '');

    // Split at common sentence endings followed by capital letters or quotes
    // This catches patterns like: ". Thủ tướng" or "." followed by quotes
    formatted = formatted.replace(/([.!?])\s+([A-ZĐÁÀẢÃẠ""])/g, '$1</p><p>$2');

    // Split at bullet points (■, ●, •) 
    formatted = formatted.replace(/\s*(■|●|•)\s*/g, '</p><p>$1 ');

    // Split at common transition phrases in Vietnamese
    formatted = formatted.replace(/\s+(Thủ tướng|Do đó|Theo đó|Ngoài ra|Bên cạnh đó|Đặc biệt|Cụ thể)\s+/g, '</p><p>$1 ');

    // Split at quotes that start new thoughts
    formatted = formatted.replace(/([.!?])\s*"([^"]+)"\s*-\s*/g, '$1</p><p>"$2" - ');

    // Clean up any empty paragraphs
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    formatted = formatted.replace(/<p>(\s|<br\/?>)*<\/p>/g, '');

    // Wrap in paragraph tags if not already wrapped
    if (!formatted.startsWith('<p>')) {
      formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('</p>')) {
      formatted = formatted + '</p>';
    }

    // Final cleanup - merge consecutive paragraph tags
    formatted = formatted.replace(/<\/p>\s*<p>/g, '</p><p>');

    return formatted;
  };

  console.log('BlogDetailPage: Rendering blog:', blog.title);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50">
      {/* Header */}
      <Header />

      {/* Back Button */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center text-gray-600 hover:text-green-600 transition-all duration-300 group"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại blog</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Featured Image */}
          {blog.featuredImageUrl && (
            <div className="relative h-72 md:h-[500px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
              <img
                src={blog.featuredImageUrl}
                alt={blog.featuredImageAlt || blog.title}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          <div className="p-6 md:p-12">
            {/* Category */}
            {blog.category && (
              <div className="mb-6 animate-slide-up">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-semibold rounded-full shadow-sm">
                  {blog.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {blog.title}
              </span>
            </h1>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed font-light border-l-4 border-green-500 pl-6 italic animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {blog.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-between mb-10 pb-8 border-b-2 border-gray-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-500 mb-4 md:mb-0">
                {blog.authorName && (
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium text-gray-700">{blog.authorName}</span>
                  </div>
                )}
                {blog.publishedAt && (
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <CalendarIcon className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium text-gray-700">{blogService.formatDate(blog.publishedAt)}</span>
                  </div>
                )}
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <EyeIcon className="w-5 h-5 mr-2 text-green-600" />
                  <span className="font-medium text-gray-700">{blog.viewCount} lượt xem</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${liked
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {liked ? (
                    <HeartSolidIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <HeartIcon className="w-5 h-5 mr-2" />
                  )}
                  <span className="font-semibold">{likeCount}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="prose-enhanced animate-slide-up mx-auto"
              style={{ animationDelay: '0.4s' }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(formatBlogContent(blog.content), {
                  allowLinks: true,
                  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr'],
                  allowedAttributes: ['href', 'target', 'src', 'alt', 'class']
                })
              }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-12 pt-8 border-t-2 border-gray-100 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center mb-5">
                  <TagIcon className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm font-medium rounded-full hover:from-green-100 hover:to-emerald-100 hover:text-green-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-3xl font-bold mb-8">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Bài viết liên quan
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog, index) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                >
                  {relatedBlog.featuredImageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={relatedBlog.featuredImageUrl}
                        alt={relatedBlog.featuredImageAlt || relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors duration-300">
                      {relatedBlog.title}
                    </h3>
                    {relatedBlog.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {relatedBlog.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
