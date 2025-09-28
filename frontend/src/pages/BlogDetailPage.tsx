import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Blog } from '../types/blog';
import { blogService } from '../services/blogService';
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    console.log('BlogDetailPage: No blog data found');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
          <p className="text-gray-600 mb-4">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Quay lại blog
          </Link>
        </div>
      </div>
    );
  }

  const tags = blogService.extractTags(blog.tags);

  console.log('BlogDetailPage: Rendering blog:', blog.title);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Quay lại blog
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {blog.featuredImageUrl && (
            <div className="relative h-64 md:h-96">
              <img
                src={blog.featuredImageUrl}
                alt={blog.featuredImageAlt || blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Category */}
            {blog.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {blog.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {blog.title}
            </h1>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {blog.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                {blog.authorName && (
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    <span>{blog.authorName}</span>
                  </div>
                )}
                {blog.publishedAt && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>{blogService.formatDate(blog.publishedAt)}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  <span>{blog.viewCount} lượt xem</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    liked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {liked ? (
                    <HeartSolidIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <HeartIcon className="w-4 h-4 mr-2" />
                  )}
                  <span>{likeCount}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Chia sẻ
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <TagIcon className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {relatedBlog.featuredImageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={relatedBlog.featuredImageUrl}
                        alt={relatedBlog.featuredImageAlt || relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {relatedBlog.title}
                    </h3>
                    {relatedBlog.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-3">
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
