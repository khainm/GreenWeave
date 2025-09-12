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
  code: string;
  name: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
  wards: Ward[];
}

export interface Ward {
  code: string;
  name: string;
}

// Sample Vietnamese provinces data (you can expand this)
export const VIETNAM_PROVINCES: Province[] = [
  {
    code: 'HN',
    name: 'Hà Nội',
    districts: [
      {
        code: 'CG',
        name: 'Cầu Giấy',
        wards: [
          { code: 'CG1', name: 'Phường Dịch Vọng' },
          { code: 'CG2', name: 'Phường Dịch Vọng Hậu' },
          { code: 'CG3', name: 'Phường Mai Dịch' },
          { code: 'CG4', name: 'Phường Nghĩa Đô' },
          { code: 'CG5', name: 'Phường Nghĩa Tân' },
          { code: 'CG6', name: 'Phường Quan Hoa' },
          { code: 'CG7', name: 'Phường Yên Hòa' }
        ]
      },
      {
        code: 'BD',
        name: 'Ba Đình',
        wards: [
          { code: 'BD1', name: 'Phường Điện Biên' },
          { code: 'BD2', name: 'Phường Đội Cấn' },
          { code: 'BD3', name: 'Phường Giảng Võ' },
          { code: 'BD4', name: 'Phường Kim Mã' },
          { code: 'BD5', name: 'Phường Liễu Giai' },
          { code: 'BD6', name: 'Phường Ngọc Hà' },
          { code: 'BD7', name: 'Phường Ngọc Khánh' },
          { code: 'BD8', name: 'Phường Nguyễn Trung Trực' },
          { code: 'BD9', name: 'Phường Phúc Xá' },
          { code: 'BD10', name: 'Phường Quán Thánh' },
          { code: 'BD11', name: 'Phường Thành Công' },
          { code: 'BD12', name: 'Phường Trúc Bạch' },
          { code: 'BD13', name: 'Phường Vĩnh Phú' }
        ]
      }
    ]
  },
  {
    code: 'HCM',
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        code: 'Q1',
        name: 'Quận 1',
        wards: [
          { code: 'Q1_1', name: 'Phường Bến Nghé' },
          { code: 'Q1_2', name: 'Phường Bến Thành' },
          { code: 'Q1_3', name: 'Phường Cầu Kho' },
          { code: 'Q1_4', name: 'Phường Cầu Ông Lãnh' },
          { code: 'Q1_5', name: 'Phường Cô Giang' },
          { code: 'Q1_6', name: 'Phường Đa Kao' },
          { code: 'Q1_7', name: 'Phường Nguyễn Cư Trinh' },
          { code: 'Q1_8', name: 'Phường Nguyễn Thái Bình' },
          { code: 'Q1_9', name: 'Phường Phạm Ngũ Lão' },
          { code: 'Q1_10', name: 'Phường Tân Định' }
        ]
      },
      {
        code: 'Q2',
        name: 'Quận 2',
        wards: [
          { code: 'Q2_1', name: 'Phường An Phú' },
          { code: 'Q2_2', name: 'Phường An Khánh' },
          { code: 'Q2_3', name: 'Phường Bình An' },
          { code: 'Q2_4', name: 'Phường Bình Khánh' },
          { code: 'Q2_5', name: 'Phường Bình Trưng Đông' },
          { code: 'Q2_6', name: 'Phường Bình Trưng Tây' },
          { code: 'Q2_7', name: 'Phường Cát Lái' },
          { code: 'Q2_8', name: 'Phường Thạnh Mỹ Lợi' },
          { code: 'Q2_9', name: 'Phường Thảo Điền' },
          { code: 'Q2_10', name: 'Phường Thủ Thiêm' }
        ]
      }
    ]
  },
  {
    code: 'DN',
    name: 'Đà Nẵng',
    districts: [
      {
        code: 'HK',
        name: 'Hải Châu',
        wards: [
          { code: 'HK1', name: 'Phường Hải Châu I' },
          { code: 'HK2', name: 'Phường Hải Châu II' },
          { code: 'HK3', name: 'Phường Phước Ninh' },
          { code: 'HK4', name: 'Phường Hòa Thuận Tây' },
          { code: 'HK5', name: 'Phường Hòa Thuận Đông' },
          { code: 'HK6', name: 'Phường Nam Dương' },
          { code: 'HK7', name: 'Phường Bình Hiên' },
          { code: 'HK8', name: 'Phường Bình Thuận' },
          { code: 'HK9', name: 'Phường Hòa Cường Bắc' },
          { code: 'HK10', name: 'Phường Hòa Cường Nam' }
        ]
      }
    ]
  }
];
