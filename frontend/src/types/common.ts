// Common types shared across the application

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ShippingAddress {
  name: string;
  phone: string;
  addressDetail: string;
  ward?: string;
  district: string;
  province: string;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}