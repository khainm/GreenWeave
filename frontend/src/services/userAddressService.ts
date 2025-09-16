import { apiClient } from './apiClient';
import type { 
  UserAddress, 
  CreateUserAddressRequest, 
  UpdateUserAddressRequest, 
  UserAddressResponse 
} from '../types/userAddress';

class UserAddressService {
  private readonly BASE_URL = '/api/useraddress';

  // Get all addresses for current user
  async getAddresses(): Promise<UserAddressResponse> {
    console.log('🏠 [UserAddressService] Getting addresses...');
    try {
      const response = await apiClient.get<UserAddressResponse>(this.BASE_URL);
      console.log('🏠 [UserAddressService] Get addresses success:', response);
      return response;
    } catch (error: any) {
      console.error('🏠 [UserAddressService] Get addresses error:', error);
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Lấy danh sách địa chỉ thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi lấy danh sách địa chỉ']
      };
      console.error('🏠 [UserAddressService] Returning error response:', errorResponse);
      return errorResponse;
    }
  }

  // Get address by ID
  async getAddressById(id: string): Promise<UserAddressResponse> {
    try {
      const response = await apiClient.get<UserAddressResponse>(`${this.BASE_URL}/${id}`);
      return response;
    } catch (error: any) {
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Lấy thông tin địa chỉ thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi lấy thông tin địa chỉ']
      };
      return errorResponse;
    }
  }

  // Get default address
  async getDefaultAddress(): Promise<UserAddress | null> {
    try {
      const response = await apiClient.get<UserAddress>(`${this.BASE_URL}/default`);
      return response;
    } catch (error: any) {
      return null;
    }
  }

  // Create new address
  async createAddress(addressData: CreateUserAddressRequest): Promise<UserAddressResponse> {
    console.log('📝 [UserAddressService] Creating address:', addressData);
    try {
      const response = await apiClient.post<UserAddressResponse>(this.BASE_URL, addressData);
      console.log('📝 [UserAddressService] Create address success:', response);
      return response;
    } catch (error: any) {
      console.error('📝 [UserAddressService] Create address error:', error);
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Tạo địa chỉ thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi tạo địa chỉ']
      };
      return errorResponse;
    }
  }

  // Update address
  async updateAddress(id: string, addressData: UpdateUserAddressRequest): Promise<UserAddressResponse> {
    try {
      const response = await apiClient.put<UserAddressResponse>(`${this.BASE_URL}/${id}`, addressData);
      return response;
    } catch (error: any) {
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Cập nhật địa chỉ thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi cập nhật địa chỉ']
      };
      return errorResponse;
    }
  }

  // Delete address
  async deleteAddress(id: string): Promise<UserAddressResponse> {
    console.log('🗑️ [UserAddressService] Deleting address:', id);
    try {
      const response = await apiClient.delete<UserAddressResponse>(`${this.BASE_URL}/${id}`);
      console.log('🗑️ [UserAddressService] Delete address success:', response);
      return response;
    } catch (error: any) {
      console.error('🗑️ [UserAddressService] Delete address error:', error);
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Xóa địa chỉ thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi xóa địa chỉ']
      };
      return errorResponse;
    }
  }

  // Set address as default
  async setDefaultAddress(id: string): Promise<UserAddressResponse> {
    console.log('⭐ [UserAddressService] Setting default address:', id);
    try {
      const response = await apiClient.post<UserAddressResponse>(`${this.BASE_URL}/${id}/set-default`);
      console.log('⭐ [UserAddressService] Set default address success:', response);
      return response;
    } catch (error: any) {
      console.error('⭐ [UserAddressService] Set default address error:', error);
      const errorResponse: UserAddressResponse = {
        success: false,
        message: error.response?.data?.message || 'Đặt địa chỉ mặc định thất bại',
        errors: error.response?.data?.errors || ['Có lỗi xảy ra khi đặt địa chỉ mặc định']
      };
      return errorResponse;
    }
  }

  // Format address for display
  formatAddress(address: UserAddress): string {
    const parts = [
      address.addressLine,
      address.ward,
      address.district,
      address.province
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // Get address type label
  getAddressTypeLabel(addressType: string): string {
    const typeMap: Record<string, string> = {
      'Home': 'Nhà riêng',
      'Office': 'Văn phòng',
      'Other': 'Khác'
    };
    return typeMap[addressType] || addressType;
  }

  // Get address type icon
  getAddressTypeIcon(addressType: string): string {
    const iconMap: Record<string, string> = {
      'Home': '🏠',
      'Office': '🏢',
      'Other': '📍'
    };
    return iconMap[addressType] || '📍';
  }
}

export const userAddressService = new UserAddressService();
