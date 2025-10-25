// Common types shared across the application

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ShippingAddress {
  fullName?: string;       // Backend uses this
  name?: string;           // Legacy field
  phoneNumber?: string;    // Backend uses this
  phone?: string;          // Legacy field
  addressLine?: string;    // Backend uses this
  addressDetail?: string;  // Legacy field
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