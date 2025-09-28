export interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  authorName?: string;
  tags?: string;
  category?: string;
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CreateBlogRequest {
  title: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateBlogRequest {
  title: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string;
  category?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface BlogListResponse {
  blogs: Blog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BlogFilters {
  status?: string;
  category?: string;
  authorId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
