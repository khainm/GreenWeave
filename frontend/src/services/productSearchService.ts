import { apiClient } from './apiClient'

export interface ProductSearchRequest {
  search?: string
  category?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  minStock?: number
  sortBy?: string
  sortDirection?: string
  page?: number
  pageSize?: number
}

export interface ProductSearchResponse {
  isSuccess: boolean
  message: string
  products: any[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export class ProductSearchService {
  private static readonly BASE_PATH = '/api/products'

  /**
   * Tìm kiếm và lọc sản phẩm
   */
  static async searchProducts(request: ProductSearchRequest): Promise<ProductSearchResponse> {
    try {
      console.log(`🔍 [ProductSearchService] Searching products with request:`, request)
      const response = await apiClient.post<ProductSearchResponse>(`${this.BASE_PATH}/search`, request)
      console.log(`✅ [ProductSearchService] Search response:`, response)
      return response
    } catch (error) {
      console.error('❌ [ProductSearchService] Error searching products:', error)
      throw new Error('Không thể tìm kiếm sản phẩm')
    }
  }

  /**
   * Tìm kiếm nhanh theo từ khóa
   */
  static async quickSearch(searchTerm: string, pageSize: number = 10): Promise<ProductSearchResponse> {
    return this.searchProducts({
      search: searchTerm,
      page: 1,
      pageSize: pageSize,
      sortBy: 'name',
      sortDirection: 'asc'
    })
  }

  /**
   * Lọc sản phẩm theo danh mục
   */
  static async filterByCategory(category: string, pageSize: number = 20): Promise<ProductSearchResponse> {
    return this.searchProducts({
      category: category,
      page: 1,
      pageSize: pageSize,
      sortBy: 'name',
      sortDirection: 'asc'
    })
  }

  /**
   * Lọc sản phẩm theo khoảng giá
   */
  static async filterByPriceRange(minPrice: number, maxPrice: number, pageSize: number = 20): Promise<ProductSearchResponse> {
    return this.searchProducts({
      minPrice: minPrice,
      maxPrice: maxPrice,
      page: 1,
      pageSize: pageSize,
      sortBy: 'price',
      sortDirection: 'asc'
    })
  }
}
