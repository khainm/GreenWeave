import { apiClient } from './apiClient';
import type {
  CalculateShippingFeeRequest,
  CalculateEcommerceShippingFeeRequest,
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
   * Update ViettelPost order status (Admin/Staff only)
   * TYPE: 1=Approve, 2=Approve Return, 3=Re-deliver, 4=Cancel, 11=Delete
   */
  static async updateViettelPostOrderStatus(
    orderId: number,
    request: { updateType: number; note?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log(`🔄 [ShippingService] Updating ViettelPost order status for order ${orderId}:`, request);
      
      const response = await apiClient.post<{
        success: boolean;
        data?: { isSuccess: boolean; message?: string; errorMessage?: string };
        message?: string;
        error?: string;
      }>(`/api/shipping/${orderId}/update-status`, {
        updateType: request.updateType,
        note: request.note || ''
      });
      
      console.log(`✅ [ShippingService] ViettelPost order status updated:`, response);
      
      if (response?.success) {
        return {
          success: true,
          message: response.data?.message || response.message || 'Cập nhật trạng thái thành công'
        };
      } else {
        return {
          success: false,
          error: response?.data?.errorMessage || response?.error || 'Cập nhật trạng thái thất bại'
        };
      }
    } catch (error: any) {
      console.error('❌ [ShippingService] Error updating ViettelPost order status:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái vận đơn'
      };
    }
  }

  /**
   * ✅ NEW: Calculate e-commerce shipping fees (warehouse → customer)
   */
  static async calculateEcommerceShippingFees(request: CalculateEcommerceShippingFeeRequest): Promise<ShippingOptionsResponse> {
    try {
      const timestamp = new Date().toISOString();
      const requestId = Math.random().toString(36).substr(2, 9);
      console.log(`🛒 [ShippingService] [${requestId}] [${timestamp}] Calculating e-commerce shipping fees with request:`, request);
      const response = await apiClient.post<{ success: boolean; data: { options: ShippingOption[] } }>('/api/shipping/calculate-ecommerce-fee', request);
      console.log(`📦 [ShippingService] [${requestId}] [${timestamp}] Received e-commerce response:`, response);
      
      if (!response || !response.success || !response.data || !response.data.options) {
        console.error(`❌ [ShippingService] [${requestId}] [${timestamp}] Invalid e-commerce response structure:`, response);
        throw new Error('Cấu trúc phản hồi không hợp lệ');
      }
      
      console.log(`✅ [ShippingService] [${requestId}] [${timestamp}] Returning e-commerce options:`, response.data.options);
      console.log(`💰 [ShippingService] [${requestId}] [${timestamp}] E-commerce fee details:`, response.data.options.map(opt => ({ 
        serviceId: opt.serviceId, 
        serviceName: opt.serviceName, 
        fee: opt.fee 
      })));
      return { options: response.data.options };
    } catch (error) {
      console.error('❌ [ShippingService] Error calculating e-commerce shipping fees:', error);
      throw new Error('Không thể tính phí vận chuyển e-commerce');
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
   * Register new inventory/warehouse with ViettelPost
   */
  static async registerInventory(request: {
    phone: string;
    name: string;
    address: string;
    wardsId: number;
  }): Promise<{ success: boolean; groupAddressId?: number; message?: string; error?: string; errorCode?: number }> {
    try {
      console.log('🔍 [ShippingService] Calling registerInventory with:', request);
      const response = await apiClient.post<{
        success: boolean;
        data?: { groupAddressId: number; message: string };
        error?: string;
        errorCode?: number;
      }>('/api/shipping/inventory/register', {
        phone: request.phone,
        name: request.name,
        address: request.address,
        wardsId: request.wardsId
      });
      
      console.log('🔍 [ShippingService] Register response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ShippingService] Registration successful!', response.data);
        return {
          success: true,
          groupAddressId: response.data.groupAddressId,
          message: response.data.message
        };
      } else {
        console.error('❌ [ShippingService] Registration failed:', response);
        return {
          success: false,
          error: response?.error || 'Đăng ký kho hàng thất bại',
          errorCode: response?.errorCode
        };
      }
    } catch (error: any) {
      console.error('❌ [ShippingService] Error registering inventory:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Không thể đăng ký kho hàng',
        errorCode: error?.response?.data?.errorCode || 500
      };
    }
  }
}

export default ShippingService;
