import React from 'react';
import { Link } from 'react-router-dom';
import type { Blog } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { 
  EyeIcon, 
  HeartIcon, 
  CalendarIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface BlogCardProps {
  blog: Blog;
  showAuthor?: boolean;
  showStatus?: boolean;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ 
  blog, 
  showAuthor = true, 
  showStatus = false,
  className = '' 
}) => {
  const tags = blogService.extractTags(blog.tags);

  return (
    <Link 
      to={`/blog/${blog.slug}`} 
      className="block"
      onClick={() => console.log('Clicking blog card with slug:', blog.slug, blog.title)}
    >
      <article className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${className}`}>
        {/* Featured Image */}
        {blog.featuredImageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={blog.featuredImageUrl}
              alt={blog.featuredImageAlt || blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {showStatus && (
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${blogService.getStatusColor(blog.status)}`}>
                  {blogService.getStatusText(blog.status)}
                </span>
              </div>
            )}
          </div>
        )}

      <div className="p-6">
        {/* Category */}
        {blog.category && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {blog.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {blog.excerpt}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{tags.length - 3} khác
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Author */}
            {showAuthor && blog.authorName && (
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                <span>{blog.authorName}</span>
              </div>
            )}

            {/* Published Date */}
            {blog.publishedAt && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>{blogService.formatDate(blog.publishedAt)}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span>{blog.viewCount}</span>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4 h-4 mr-1" />
              <span>{blog.likeCount}</span>
            </div>
          </div>
        </div>
      </div>
      </article>
    </Link>
  );
};

export default BlogCard;
