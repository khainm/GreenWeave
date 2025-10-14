import { apiClient } from './apiClient'
import type { Category, CreateCategoryRequest } from '../types/category'

// Simple cache for categories
let categoriesCache: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class CategoryService {
  private static readonly BASE = '/api/categories'

  static async list(useCache: boolean = true): Promise<Category[]> {
    // Check cache first
    if (useCache && categoriesCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
      console.log('📦 [CategoryService] Returning cached categories');
      return categoriesCache;
    }

    console.log('🌐 [CategoryService] Fetching categories from API');
    const categories = await apiClient.get<Category[]>(this.BASE);
    
    // Cache the result
    if (useCache) {
      categoriesCache = categories;
      cacheTimestamp = Date.now();
    }
    
    return categories;
  }

  static async get(id: number): Promise<Category> {
    return await apiClient.get<Category>(`${this.BASE}/${id}`)
  }

  static async create(payload: CreateCategoryRequest): Promise<Category> {
    return await apiClient.post<Category>(this.BASE, payload)
  }

  static async update(id: number, payload: CreateCategoryRequest): Promise<Category> {
    return await apiClient.put<Category>(`${this.BASE}/${id}`, payload)
  }

  static async remove(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE}/${id}`)
  }
}

export default CategoryService


