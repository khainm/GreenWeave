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
      const data = await apiClient.get<AddressApiResponse<AddressDto[]>>('/api/viettelpostaddress/provinces');
      console.log('🔍 [ViettelPostAddressService] Received data:', data);
      
      if (data?.success && data?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning provinces:', data.data);
        return data.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', data);
      throw new Error(data?.message || 'Failed to get provinces');
    } catch (error) {
      console.error('❌ [ViettelPostAddressService] Error getting provinces:', error);
      throw new Error('Không thể lấy danh sách tỉnh/thành phố');
    }
  }

  /**
   * Get list of districts by province ID from Viettel Post API
   */
  static async getDistricts(provinceId: number): Promise<AddressDto[]> {
    try {
      console.log('🔍 [ViettelPostAddressService] Calling getDistricts with provinceId:', provinceId);
      const data = await apiClient.get<AddressApiResponse<AddressDto[]>>(
        `/api/viettelpostaddress/districts?provinceId=${provinceId}`
      );
      console.log('🔍 [ViettelPostAddressService] Received districts data:', data);
      
      if (data?.success && data?.data) {
        console.log('✅ [ViettelPostAddressService] Success! Returning districts:', data.data);
        return data.data;
      }
      
      console.error('❌ [ViettelPostAddressService] API returned success=false or no data:', data);
      throw new Error(data?.message || 'Failed to get districts');
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
      const data = await apiClient.get<AddressApiResponse<AddressDto[]>>(
        `/api/viettelpostaddress/wards?districtId=${districtId}`
      );
      if (data?.success && data?.data) {
        return data.data;
      }
      throw new Error(data?.message || 'Failed to get wards');
    } catch (error) {
      console.error('Error getting wards:', error);
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
