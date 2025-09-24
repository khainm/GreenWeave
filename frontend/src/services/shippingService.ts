import { apiClient } from './apiClient';
import type {
  CalculateShippingFeeRequest,
  ShippingOptionsResponse,
  ShippingOption,
  CreateShipmentRequest,
  CancelShipmentRequest,
  TrackingInfo,
  ShippingRequest
} from '../types';

export class ShippingService {
  /**
   * Calculate shipping fees for all available providers
   */
  static async calculateShippingFees(request: CalculateShippingFeeRequest): Promise<ShippingOptionsResponse> {
    try {
      const timestamp = new Date().toISOString();
      const requestId = Math.random().toString(36).substr(2, 9);
      console.log(`🚀 [ShippingService] [${requestId}] [${timestamp}] Calculating shipping fees with request:`, request);
      const response = await apiClient.post<{ success: boolean; data: { options: ShippingOption[] } }>('/api/shipping/calculate-fee', request);
      console.log(`📦 [ShippingService] [${requestId}] [${timestamp}] Received response:`, response);
      
      if (!response || !response.success || !response.data || !response.data.options) {
        console.error(`❌ [ShippingService] [${requestId}] [${timestamp}] Invalid response structure:`, response);
        throw new Error('Cấu trúc phản hồi không hợp lệ');
      }
      
      console.log(`✅ [ShippingService] [${requestId}] [${timestamp}] Returning options:`, response.data.options);
      console.log(`💰 [ShippingService] [${requestId}] [${timestamp}] Fee details:`, response.data.options.map(opt => ({ 
        serviceId: opt.serviceId, 
        serviceName: opt.serviceName, 
        fee: opt.fee 
      })));
      return { options: response.data.options };
    } catch (error) {
      console.error('❌ [ShippingService] Error calculating shipping fees:', error);
      throw new Error('Không thể tính phí vận chuyển');
    }
  }

  /**
   * Create shipment for an order (Admin/Staff only)
   */
  static async createShipment(orderId: number, request: Omit<CreateShipmentRequest, 'orderId'>): Promise<void> {
    try {
      await apiClient.post(`/api/shipping/create/${orderId}`, request);
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw new Error('Không thể tạo vận đơn');
    }
  }

  /**
   * Cancel shipment (Admin/Staff only)
   */
  static async cancelShipment(orderId: number, request: CancelShipmentRequest): Promise<void> {
    try {
      await apiClient.post(`/api/shipping/cancel/${orderId}`, request);
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      throw new Error('Không thể hủy vận đơn');
    }
  }

  /**
   * Get tracking information for an order
   */
  static async getTracking(orderId: number): Promise<TrackingInfo | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: TrackingInfo }>(`/api/shipping/track/${orderId}`);
      
      if (!response || !response.data || !(response.data as any).data) {
        console.error('Invalid tracking response structure:', response);
        return null;
      }
      
      return (response.data as any).data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting tracking info:', error);
      throw new Error('Không thể lấy thông tin vận chuyển');
    }
  }

  /**
   * Get shipping request details (Admin/Staff only)
   */
  static async getShippingRequest(orderId: number): Promise<ShippingRequest | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ShippingRequest }>(`/api/shipping/request/${orderId}`);
      
      if (!response || !response.data || !(response.data as any).data) {
        console.error('Invalid shipping request response structure:', response);
        return null;
      }
      
      return (response.data as any).data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting shipping request:', error);
      throw new Error('Không thể lấy thông tin yêu cầu vận chuyển');
    }
  }

  /**
   * List inventory/warehouse from Viettel Post
   */
  static async listInventory(): Promise<any[]> {
    try {
      console.log('🔍 [ShippingService] Calling listInventory...');
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/shipping/inventory');
      console.log('🔍 [ShippingService] Received response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ShippingService] Success! Returning inventory:', response.data);
        return response.data;
      }
      
      console.error('❌ [ShippingService] API returned success=false or no data:', response);
      throw new Error('Failed to get inventory list');
    } catch (error) {
      console.error('❌ [ShippingService] Error getting inventory list:', error);
      throw new Error('Không thể lấy danh sách kho hàng');
    }
  }
}

export default ShippingService;
