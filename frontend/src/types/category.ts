export interface Category {
  id: number
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
  updatedAt: string
  productCount?: number
}

export interface CreateCategoryRequest {
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
}


