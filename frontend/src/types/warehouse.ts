export interface Warehouse {
  id: string
  name: string
  phone: string
  addressDetail: string
  provinceId: number
  districtId: number
  wardId: number
  provinceName: string
  districtName: string
  wardName: string
  groupAddressId?: number
  isRegistered: boolean
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface CreateWarehouseRequest {
  name: string
  phone: string
  addressDetail: string
  provinceId: number
  districtId: number
  wardId: number
  provinceName: string
  districtName: string
  wardName: string
  isDefault: boolean
  notes?: string
}

export interface UpdateWarehouseRequest {
  name: string
  phone: string
  addressDetail: string
  provinceId: number
  districtId: number
  wardId: number
  provinceName: string
  districtName: string
  wardName: string
  isDefault: boolean
  notes?: string
}

export interface WarehouseResponse {
  success: boolean
  message: string
  warehouse?: Warehouse
  warehouses?: Warehouse[]
  errors: string[]
}

export interface RegisterWarehouseResult {
  isSuccess: boolean
  groupAddressId?: number
  message: string
  errorMessage?: string
}
