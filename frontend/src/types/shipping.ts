// Shipping types for frontend
export const ShippingProvider = {
  ViettelPost: 'ViettelPost'
} as const;

export type ShippingProvider = typeof ShippingProvider[keyof typeof ShippingProvider];

export const ShippingStatus = {
  PendingPickup: 'PendingPickup',
  Picked: 'Picked',
  InTransit: 'InTransit',
  OutForDelivery: 'OutForDelivery',
  Delivered: 'Delivered',
  Failed: 'Failed',
  Returning: 'Returning',
  Returned: 'Returned',
  Cancelled: 'Cancelled'
} as const;

export type ShippingStatus = typeof ShippingStatus[keyof typeof ShippingStatus];

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

export interface ShippingDimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
}

export interface CalculateShippingFeeRequest {
  provider: ShippingProvider;
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  weight: number; // grams
  dimensions?: ShippingDimensions;
  insuranceValue: number;
  codAmount: number;
  serviceId?: string;
}

export interface ShippingOption {
  provider: ShippingProvider;
  providerName: string;
  serviceId?: string;
  serviceName?: string;
  fee: number;
  estimatedDeliveryDays?: number;
  isAvailable: boolean;
  errorMessage?: string;
}

export interface ShippingOptionsResponse {
  options: ShippingOption[];
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
}

export interface TrackingInfo {
  trackingCode: string;
  status: string;
  statusDescription: string;
  events: TrackingEvent[];
  estimatedDeliveryDate?: string;
  currentLocation?: string;
}

export interface ShippingHistoryEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
}

export interface CreateShipmentRequest {
  orderId: number;
  provider: ShippingProvider;
  serviceId?: string;
  note?: string;
  requireSignature?: boolean;
}

export interface CancelShipmentRequest {
  reason: string;
}

export interface ShippingRequest {
  id: number;
  orderId: number;
  provider: string;
  serviceId?: string;
  fee: number;
  status: string;
  trackingCode?: string;
  externalId?: string;
  createdAt: string;
  pickedAt?: string;
  deliveredAt?: string;
  note?: string;
}

// Provider display names for UI
export const ShippingProviderNames: Record<ShippingProvider, string> = {
  [ShippingProvider.ViettelPost]: 'Viettel Post'
};

// Status display names for UI
export const ShippingStatusNames: Record<ShippingStatus, string> = {
  [ShippingStatus.PendingPickup]: 'Chờ lấy hàng',
  [ShippingStatus.Picked]: 'Đã lấy hàng',
  [ShippingStatus.InTransit]: 'Đang vận chuyển',
  [ShippingStatus.OutForDelivery]: 'Đang giao hàng',
  [ShippingStatus.Delivered]: 'Đã giao hàng',
  [ShippingStatus.Failed]: 'Giao hàng thất bại',
  [ShippingStatus.Returning]: 'Đang hoàn trả',
  [ShippingStatus.Returned]: 'Đã hoàn trả',
  [ShippingStatus.Cancelled]: 'Đã hủy'
};

// Status colors for UI
export const ShippingStatusColors: Record<ShippingStatus, string> = {
  [ShippingStatus.PendingPickup]: 'text-yellow-600 bg-yellow-100',
  [ShippingStatus.Picked]: 'text-blue-600 bg-blue-100',
  [ShippingStatus.InTransit]: 'text-blue-600 bg-blue-100',
  [ShippingStatus.OutForDelivery]: 'text-orange-600 bg-orange-100',
  [ShippingStatus.Delivered]: 'text-green-600 bg-green-100',
  [ShippingStatus.Failed]: 'text-red-600 bg-red-100',
  [ShippingStatus.Returning]: 'text-purple-600 bg-purple-100',
  [ShippingStatus.Returned]: 'text-purple-600 bg-purple-100',
  [ShippingStatus.Cancelled]: 'text-gray-600 bg-gray-100'
};

// Inventory types for ViettelPost
export interface InventoryData {
  groupAddressId: number;
  cusId: number;
  name: string;
  phone: string;
  address: string;
  provinceId: number;
  districtId: number;
  wardsId: number;
}

export interface ListInventoryResult {
  isSuccess: boolean;
  message: string;
  errorMessage?: string;
  inventories?: InventoryData[];
}
