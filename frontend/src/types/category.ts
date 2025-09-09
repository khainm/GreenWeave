export interface Category {
  id: number
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
  isVisible: boolean // Auto-set based on status (active = true, inactive = false)
  isCustomizable: boolean
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
  isVisible?: boolean // Optional, will be auto-set based on status if not provided
  isCustomizable?: boolean
}


