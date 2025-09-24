import { apiClient } from './apiClient';

export interface AddressDto {
  id: number;
  name: string;
  code: string;
}

export interface DistrictWithWardsDto extends AddressDto {
  provinceId: number;
  wards: AddressDto[];
}

export interface ProvinceWithDistrictsDto extends AddressDto {
  districts: DistrictWithWardsDto[];
}

export interface AddressApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export class ViettelPostAddressService {
  /**
   * Get list of provinces from Viettel Post API
   */
  static async getProvinces(): Promise<AddressDto[]> {
    try {
      console.log('🔍 [ViettelPostAddressService] Calling getProvinces...');
      const response = await apiClient.get<AddressApiResponse<AddressDto[]>>('/api/viettelpostaddress/provinces');
      console.log('🔍 [ViettelPostAddressService] Received response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning provinces:', response.data);
        return response.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', response);
      throw new Error(response?.message || 'Failed to get provinces');
    } catch (error) {
      console.error('❌ [ViettelPostAddressService] Error getting provinces:', error);
      throw new Error('Không thể lấy danh sách tỉnh/thành phố');
    }
  }

  /**
   * Get province by ID from Viettel Post API
   */
  static async getProvinceById(provinceId: number): Promise<AddressDto> {
    try {
      console.log('🔍 [ViettelPostAddressService] Calling getProvinceById for ID:', provinceId);
      const response = await apiClient.get<AddressApiResponse<AddressDto>>(`/api/viettelpostaddress/province/${provinceId}`);
      console.log('🔍 [ViettelPostAddressService] Received response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning province:', response.data);
        return response.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', response);
      throw new Error(response?.message || 'Failed to get province');
    } catch (error) {
      console.error('❌ [ViettelPostAddressService] Error getting province by ID:', error);
      throw new Error('Không thể lấy thông tin tỉnh/thành phố');
    }
  }

  /**
   * Get list of districts by province ID from Viettel Post API
   */
  static async getDistricts(provinceId: number): Promise<AddressDto[]> {
    try {
      console.log('🔍 [ViettelPostAddressService] Calling getDistricts with provinceId:', provinceId);
      const response = await apiClient.get<AddressApiResponse<AddressDto[]>>(
        `/api/viettelpostaddress/districts?provinceId=${provinceId}`
      );
      console.log('🔍 [ViettelPostAddressService] Received districts response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning districts:', response.data);
        return response.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', response);
      throw new Error(response?.message || 'Failed to get districts');
    } catch (error) {
      console.error('❌ [ViettelPostAddressService] Error getting districts:', error);
      throw new Error('Không thể lấy danh sách quận/huyện');
    }
  }

  /**
   * Get list of wards by district ID from Viettel Post API
   */
  static async getWards(districtId: number): Promise<AddressDto[]> {
    try {
      console.log('🔍 [ViettelPostAddressService] Calling getWards with districtId:', districtId);
      const response = await apiClient.get<AddressApiResponse<AddressDto[]>>(
        `/api/viettelpostaddress/wards?districtId=${districtId}`
      );
      console.log('🔍 [ViettelPostAddressService] Received wards response:', response);
      
      if (response?.success && response?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning wards:', response.data);
        return response.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', response);
      throw new Error(response?.message || 'Failed to get wards');
    } catch (error) {
      console.error('❌ [ViettelPostAddressService] Error getting wards:', error);
      throw new Error('Không thể lấy danh sách phường/xã');
    }
  }

  /**
   * Get province with all districts and wards
   */
  static async getProvinceWithDistricts(provinceId: number): Promise<ProvinceWithDistrictsDto> {
    try {
      const data = await apiClient.get<AddressApiResponse<ProvinceWithDistrictsDto>>(
        `/api/viettelpostaddress/province-with-districts?provinceId=${provinceId}`
      );
      if (data?.success && data?.data) {
        return data.data;
      }
      throw new Error(data?.message || 'Failed to get province with districts');
    } catch (error) {
      console.error('Error getting province with districts:', error);
      throw new Error('Không thể lấy thông tin tỉnh/thành phố');
    }
  }
}

export default ViettelPostAddressService;
