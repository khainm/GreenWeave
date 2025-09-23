import { apiClient } from './apiClient';
export interface ProductWarehouseStock {
  id: number
  productId: number
  productName: string
  productSku: string
  warehouseId: string
  warehouseName: string
  stock: number
  reservedStock: number
  availableStock: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductWarehouseStockRequest {
  productId: number
  warehouseId: string
  stock: number
  reservedStock?: number
}

export interface UpdateProductWarehouseStockRequest {
  stock: number
  reservedStock: number
}

export interface ProductStockSummary {
  productId: number
  productName: string
  productSku: string
  totalStock: number
  totalReservedStock: number
  totalAvailableStock: number
  warehouseStocks: ProductWarehouseStock[]
}

class ProductWarehouseStockService {
  private baseUrl = '/api/ProductWarehouseStock'

  // Lấy tất cả warehouse stock
  async getAll(): Promise<ProductWarehouseStock[]> {
    try {
      const response = await apiClient.get<ProductWarehouseStock[]>(this.baseUrl)
      return response || []
    } catch (error) {
      console.error('📦 [ProductWarehouseStockService] Get all stocks error:', error)
      throw error
    }
  }

  // Lấy warehouse stock theo product ID
  async getByProductId(productId: number): Promise<ProductWarehouseStock[]> {
    try {
      const response = await apiClient.get<ProductWarehouseStock[]>(`${this.baseUrl}/product/${productId}`)
      return response || []
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get stocks by product ${productId} error:`, error)
      throw error
    }
  }

  // Lấy warehouse stock theo warehouse ID
  async getByWarehouseId(warehouseId: string): Promise<ProductWarehouseStock[]> {
    try {
      const response = await apiClient.get<ProductWarehouseStock[]>(`${this.baseUrl}/warehouse/${warehouseId}`)
      return response || []
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get stocks by warehouse ${warehouseId} error:`, error)
      throw error
    }
  }

  // Lấy warehouse stock cụ thể
  async getById(id: number): Promise<ProductWarehouseStock> {
    try {
      const response = await apiClient.get<ProductWarehouseStock>(`${this.baseUrl}/${id}`)
      return response
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get stock ${id} error:`, error)
      throw error
    }
  }

  // Tạo warehouse stock mới
  async create(data: CreateProductWarehouseStockRequest): Promise<ProductWarehouseStock> {
    try {
      const response = await apiClient.post<ProductWarehouseStock>(this.baseUrl, data)
      return response
    } catch (error) {
      console.error('📦 [ProductWarehouseStockService] Create stock error:', error)
      throw error
    }
  }

  // Cập nhật warehouse stock
  async update(id: number, data: UpdateProductWarehouseStockRequest): Promise<ProductWarehouseStock> {
    try {
      const response = await apiClient.put<ProductWarehouseStock>(`${this.baseUrl}/${id}`, data)
      return response
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Update stock ${id} error:`, error)
      throw error
    }
  }

  // Xóa warehouse stock
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Delete stock ${id} error:`, error)
      throw error
    }
  }

  // Lấy sản phẩm có stock thấp
  async getLowStockProducts(threshold: number = 10): Promise<ProductWarehouseStock[]> {
    try {
      const response = await apiClient.get<ProductWarehouseStock[]>(`${this.baseUrl}/low-stock?threshold=${threshold}`)
      return response || []
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get low stock products (threshold: ${threshold}) error:`, error)
      throw error
    }
  }

  // Lấy tổng quan stock của sản phẩm
  async getProductStockSummary(productId: number): Promise<ProductStockSummary> {
    try {
      const response = await apiClient.get<ProductStockSummary>(`${this.baseUrl}/summary/product/${productId}`)
      return response
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get stock summary for product ${productId} error:`, error)
      throw error
    }
  }

  // Utility: Kiểm tra stock có đủ không
  async checkStockAvailability(productId: number, warehouseId: string, requiredQuantity: number): Promise<boolean> {
    try {
      const stocks = await this.getByProductId(productId)
      const warehouseStock = stocks.find(stock => stock.warehouseId === warehouseId)
      return warehouseStock ? warehouseStock.availableStock >= requiredQuantity : false
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Check stock availability error:`, error)
      return false
    }
  }

  // Utility: Lấy tổng stock của sản phẩm từ tất cả kho
  async getTotalProductStock(productId: number): Promise<number> {
    try {
      const stocks = await this.getByProductId(productId)
      return stocks.reduce((total, stock) => total + stock.availableStock, 0)
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get total product stock error:`, error)
      return 0
    }
  }

  // Utility: Lấy kho có stock cao nhất cho sản phẩm
  async getBestWarehouseForProduct(productId: number): Promise<ProductWarehouseStock | null> {
    try {
      const stocks = await this.getByProductId(productId)
      if (stocks.length === 0) return null
      
      return stocks.reduce((best, current) => 
        current.availableStock > best.availableStock ? current : best
      )
    } catch (error) {
      console.error(`📦 [ProductWarehouseStockService] Get best warehouse for product error:`, error)
      return null
    }
  }
}

export default new ProductWarehouseStockService()
