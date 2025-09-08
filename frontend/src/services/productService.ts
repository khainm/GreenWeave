import { apiClient } from './apiClient'
import type { Product, CreateProductRequest } from '../types/product'

export class ProductService {
  private static readonly BASE_PATH = '/api/products'

  private static buildFormData(productData: CreateProductRequest): FormData {
    const formData = new FormData()
    formData.append('Name', productData.name)
    formData.append('Sku', productData.sku)
    formData.append('Category', productData.category)
    formData.append('Price', productData.price.toString())
    formData.append('Stock', productData.stock.toString())
    formData.append('Status', productData.status)
    if (productData.description) formData.append('Description', productData.description)
    if (productData.originalPrice) formData.append('OriginalPrice', productData.originalPrice.toString())
    if (productData.colors?.length) {
      productData.colors.forEach((color, index) => formData.append(`Colors[${index}]`, color))
    }
    if (productData.imageUrls?.length) {
      productData.imageUrls.forEach((url, index) => formData.append(`ImageUrls[${index}]`, url))
    }
    if (productData.imageFiles?.length) {
      productData.imageFiles.forEach(file => formData.append('ImageFiles', file))
    }
    return formData
  }

  // Lấy tất cả sản phẩm
  static async getAllProducts(): Promise<Product[]> {
    try {
      return await apiClient.get<Product[]>(this.BASE_PATH)
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  // Lấy sản phẩm theo ID
  static async getProductById(id: number): Promise<Product> {
    try {
      return await apiClient.get<Product>(`${this.BASE_PATH}/${id}`)
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  // Lấy sản phẩm theo SKU
  static async getProductBySku(sku: string): Promise<Product> {
    try {
      return await apiClient.get<Product>(`${this.BASE_PATH}/sku/${sku}`)
    } catch (error) {
      console.error('Error fetching product by SKU:', error)
      throw error
    }
  }

  // Tạo sản phẩm mới
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const formData = this.buildFormData(productData)
      return await apiClient.postForm<Product>(this.BASE_PATH, formData)
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  // Cập nhật sản phẩm
  static async updateProduct(id: number, productData: CreateProductRequest): Promise<Product> {
    try {
      const formData = this.buildFormData(productData)
      return await apiClient.putForm<Product>(`${this.BASE_PATH}/${id}`, formData)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  // Xóa sản phẩm
  static async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/${id}`)
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  // Tạo SKU tự động theo danh mục
  static generateSku(category: string): string {
    const prefixMap: Record<string, string> = {
      'Non-stop': 'NON',
      'Trơn': 'TRON', 
      'Thêu': 'THEU'
    }
    
    const prefix = prefixMap[category] || 'GW'
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}${randomNum}`
  }

  // Helper để convert file thành base64 để preview
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
}

export default ProductService
