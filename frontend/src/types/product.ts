export interface ProductImage {
  id: number
  imageUrl: string
  sortOrder: number
  isPrimary: boolean
  colorCode?: string
}

export interface ProductColor {
  id: number
  colorCode: string
  colorName?: string
  sortOrder: number
}

export interface ProductSticker {
  id: number
  imageUrl: string
  sortOrder: number
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  description?: string
  // Regular product fields (nullable for custom products)
  price?: number
  originalPrice?: number
  stock?: number
  weight?: number
  primaryWarehouseId?: string
  primaryWarehouseName?: string
  // Custom product fields (nullable for regular products)
  consultationNote?: string
  // Common fields
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  images: ProductImage[]
  colors: ProductColor[]
  stickers?: ProductSticker[]
}

export interface CreateProductRequest {
  name: string
  sku: string
  category: string
  description?: string
  // Regular product fields (optional for custom products)
  price?: number
  originalPrice?: number
  stock?: number
  weight?: number
  primaryWarehouseId?: string
  // Custom product fields (optional for regular products)
  consultationNote?: string
  // Common fields
  status: 'active' | 'inactive'
  colors?: string[]
  imageUrls?: string[]
  imageFiles?: File[]
  // Note: Backend tự động map ảnh với màu theo thứ tự upload
}
