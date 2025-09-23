import { apiClient } from './apiClient'
import type { 
  Warehouse, 
  CreateWarehouseRequest, 
  UpdateWarehouseRequest, 
  WarehouseResponse,
  RegisterWarehouseResult 
} from '../types/warehouse'

class WarehouseService {
  private baseUrl = '/api/warehouse'

  async getAllWarehouses(): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.get<WarehouseResponse>(this.baseUrl)
      return response || { success: false, message: 'Không có dữ liệu', warehouses: [], errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Get all warehouses error:', error)
      throw error
    }
  }

  async getWarehouseById(id: string): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.get<WarehouseResponse>(`${this.baseUrl}/${id}`)
      return response || { success: false, message: 'Không tìm thấy kho hàng', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Get warehouse by id error:', error)
      throw error
    }
  }

  async getDefaultWarehouse(): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.get<WarehouseResponse>(`${this.baseUrl}/default`)
      return response || { success: false, message: 'Không có kho mặc định', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Get default warehouse error:', error)
      throw error
    }
  }

  async createWarehouse(data: CreateWarehouseRequest): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.post<WarehouseResponse>(this.baseUrl, data)
      return response || { success: false, message: 'Tạo kho hàng thất bại', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Create warehouse error:', error)
      throw error
    }
  }

  async updateWarehouse(id: string, data: UpdateWarehouseRequest): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.put<WarehouseResponse>(`${this.baseUrl}/${id}`, data)
      return response || { success: false, message: 'Cập nhật kho hàng thất bại', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Update warehouse error:', error)
      throw error
    }
  }

  async deleteWarehouse(id: string): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.delete<WarehouseResponse>(`${this.baseUrl}/${id}`)
      return response || { success: false, message: 'Xóa kho hàng thất bại', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Delete warehouse error:', error)
      throw error
    }
  }

  async setAsDefault(id: string): Promise<WarehouseResponse> {
    try {
      const response: WarehouseResponse = await apiClient.post<WarehouseResponse>(`${this.baseUrl}/${id}/set-default`)
      return response || { success: false, message: 'Đặt kho mặc định thất bại', warehouse: undefined, errors: [] }
    } catch (error) {
      console.error('📝 [WarehouseService] Set as default error:', error)
      throw error
    }
  }

  async registerWithViettelPost(id: string): Promise<RegisterWarehouseResult> {
    try {
      const response: RegisterWarehouseResult = await apiClient.post<RegisterWarehouseResult>(`${this.baseUrl}/${id}/register`)
      return response || { isSuccess: false, message: 'Đăng ký với ViettelPost thất bại', errorMessage: 'Không có dữ liệu phản hồi' }
    } catch (error) {
      console.error('📝 [WarehouseService] Register with ViettelPost error:', error)
      throw error
    }
  }
}

export default new WarehouseService()
