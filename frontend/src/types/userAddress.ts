export interface UserAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string;
  district: string;
  province: string;
  postalCode?: string;
  addressType: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserAddressRequest {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string;
  district: string;
  province: string;
  postalCode?: string;
  addressType: string;
  isDefault: boolean;
}

export interface UpdateUserAddressRequest {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward?: string;
  district: string;
  province: string;
  postalCode?: string;
  addressType: string;
  isDefault: boolean;
}

export interface UserAddressResponse {
  success: boolean;
  message: string;
  address?: UserAddress;
  addresses?: UserAddress[];
  errors?: string[];
}

export interface AddressType {
  value: string;
  label: string;
  icon: string;
}

export const ADDRESS_TYPES: AddressType[] = [
  { value: 'Home', label: 'Nhà riêng', icon: '🏠' },
  { value: 'Office', label: 'Văn phòng', icon: '🏢' },
  { value: 'Other', label: 'Khác', icon: '📍' }
];

export interface Province {
  id: number;
  code: string;
  name: string;
  districts: District[];
}

export interface District {
  id: number;
  code: string;
  name: string;
  provinceId?: number;
  wards: Ward[];
}

export interface Ward {
  id: number;
  code: string;
  name: string;
  districtId?: number;
}

// Mock data removed - now using Viettel Post APIs for real-time address data
