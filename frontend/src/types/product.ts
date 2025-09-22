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
  price: number
  originalPrice?: number
  stock: number
  weight: number
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
  price: number
  originalPrice?: number
  stock: number
  weight: number
  status: 'active' | 'inactive'
  colors?: string[]
  imageUrls?: string[]
  imageFiles?: File[]
  // Map color code → file for color-specific images
  colorImageFiles?: Record<string, File>
  // Sticker fields
  stickerFiles?: File[] // Files sticker từ máy tính
  stickerUrls?: string[] // URLs sticker từ internet
  stickers?: Array<{ // Stickers đã đặt (chỉ gửi fields backend hỗ trợ)
    id: number
    imageUrl: string
    sortOrder: number
  }>
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  success: boolean
}
