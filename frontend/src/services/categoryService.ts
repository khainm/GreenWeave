import { apiClient } from './apiClient'
import type { Category, CreateCategoryRequest } from '../types/category'

export class CategoryService {
  private static readonly BASE = '/api/categories'

  static async list(): Promise<Category[]> {
    return await apiClient.get<Category[]>(this.BASE)
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


