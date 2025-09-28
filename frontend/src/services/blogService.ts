import { apiClient } from './apiClient';
import type { Blog, CreateBlogRequest, UpdateBlogRequest, BlogListResponse, BlogFilters } from '../types/blog';

export class BlogService {
  // Public APIs (no authentication required)
  async getPublishedBlogs(): Promise<Blog[]> {
    return apiClient.get<Blog[]>('/api/blog/published');
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    console.log('Getting blog by slug:', slug);
    return apiClient.get<Blog>(`/api/blog/slug/${slug}`);
  }

  async getBlogsByCategory(category: string): Promise<Blog[]> {
    if (!category || category.trim() === '') {
      throw new Error('Category is required');
    }
    return apiClient.get<Blog[]>(`/api/blog/category/${encodeURIComponent(category)}`);
  }

  async searchBlogs(query: string): Promise<Blog[]> {
    return apiClient.get<Blog[]>(`/api/blog/search?q=${encodeURIComponent(query)}`);
  }

  async getRecentBlogs(count: number = 5): Promise<Blog[]> {
    return apiClient.get<Blog[]>(`/api/blog/recent/${count}`);
  }

  async getPopularBlogs(count: number = 5): Promise<Blog[]> {
    return apiClient.get<Blog[]>(`/api/blog/popular/${count}`);
  }

  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/api/blog/categories');
  }

  async getTags(): Promise<string[]> {
    return apiClient.get<string[]>('/api/blog/tags');
  }

  async likeBlog(id: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/api/blog/${id}/like`);
  }

  async unlikeBlog(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/blog/${id}/like`);
  }

  async getLikeStatus(id: number): Promise<{ hasLiked: boolean }> {
    return apiClient.get<{ hasLiked: boolean }>(`/api/blog/${id}/like-status`);
  }

  // Admin APIs (authentication required)
  async getAllBlogs(): Promise<Blog[]> {
    return apiClient.get<Blog[]>('/api/blog');
  }

  async getBlogById(id: number): Promise<Blog> {
    return apiClient.get<Blog>(`/api/blog/${id}`);
  }

  async getBlogsByStatus(status: string): Promise<Blog[]> {
    return apiClient.get<Blog[]>(`/api/blog/status/${status}`);
  }

  async createBlog(blogData: CreateBlogRequest): Promise<Blog> {
    return apiClient.post<Blog>('/api/blog', blogData);
  }

  async updateBlog(id: number, blogData: UpdateBlogRequest): Promise<Blog> {
    return apiClient.put<Blog>(`/api/blog/${id}`, blogData);
  }

  async deleteBlog(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/blog/${id}`);
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'published':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      case 'archived':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  extractTags(tagsString?: string): string[] {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  joinTags(tags: string[]): string {
    return tags.join(', ');
  }
}

export const blogService = new BlogService();
