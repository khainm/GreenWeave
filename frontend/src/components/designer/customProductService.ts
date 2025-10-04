import { apiClient } from '../../services/apiClient';
import type { ProductResponseDto, UploadResponse } from './types';

export class CustomProductService {
  // Lấy danh sách sản phẩm có thể tùy chỉnh
  static async getCustomizableProducts(): Promise<ProductResponseDto[]> {
    try {
      console.log('🛍️ [CustomProductService] Fetching customizable products...');
      const response = await apiClient.get<ProductResponseDto[]>('/api/products/customizable');
      
      console.log('🛍️ [CustomProductService] Customizable products received:', response);
      
      // Ensure response is always an array
      const products = Array.isArray(response) ? response : [];
      
      console.log('🛍️ [CustomProductService] Processed products:', products.length, 'items');
      
      return products;
    } catch (error) {
      console.error('❌ [CustomProductService] Error fetching customizable products:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  // Lấy chi tiết sản phẩm có thể tùy chỉnh theo ID
  static async getCustomizableProductById(id: number): Promise<ProductResponseDto> {
    try {
      console.log(`🛍️ [CustomProductService] Fetching customizable product ${id}...`);
      const response = await apiClient.get<ProductResponseDto>(`/api/products/customizable/${id}`);
      console.log('🛍️ [CustomProductService] Product details received:', response);
      return response;
    } catch (error) {
      console.error('❌ [CustomProductService] Error fetching customizable product:', error);
      throw error;
    }
  }

  // Upload ảnh/sticker
  static async uploadImage(file: File, type: 'image' | 'sticker' = 'image'): Promise<UploadResponse> {
    try {
      console.log(`📤 [CustomProductService] Uploading ${type}:`, file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await apiClient.postForm<UploadResponse>('/api/upload', formData);
      
      console.log('📤 [CustomProductService] Upload response:', response);
      return response;
    } catch (error) {
      console.error('❌ [CustomProductService] Error uploading image:', error);
      throw error;
    }
  }

  // Lưu design tùy chỉnh (có thể mở rộng sau)
  static async saveCustomDesign(design: any): Promise<{ success: boolean; id?: string }> {
    try {
      console.log('💾 [CustomProductService] Saving custom design...', design);
      // TODO: Implement custom design save API
      return { success: true, id: 'temp-id' };
    } catch (error) {
      console.error('❌ [CustomProductService] Error saving custom design:', error);
      throw error;
    }
  }
}