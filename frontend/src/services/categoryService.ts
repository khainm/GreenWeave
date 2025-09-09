import { apiClient } from './apiClient'
import type { Category, CreateCategoryRequest } from '../types/category'

export class CategoryService {
  private static readonly BASE = '/api/categories'

  static async list(params?: { visible?: boolean; customizable?: boolean }): Promise<Category[]> {
    const query = new URLSearchParams()
    // Note: visible parameter is deprecated - use status filtering instead
    if (params?.visible !== undefined) query.set('visible', String(params.visible))
    if (params?.customizable !== undefined) query.set('customizable', String(params.customizable))
    const url = query.toString() ? `${this.BASE}?${query.toString()}` : this.BASE
    return await apiClient.get<Category[]>(url)
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


