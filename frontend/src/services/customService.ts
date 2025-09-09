import { apiClient } from './apiClient'

export type CustomBaseLayer = {
  id: number
  layerType: string
  zIndex: number
  x: number
  y: number
  width: number
  height: number
  constraintsJson?: string
}

export type CustomBaseAngle = {
  id: number
  angleKey: string
  sortOrder: number
  layers: CustomBaseLayer[]
}

export type CustomOption = {
  id: number
  code: string
  displayName: string
  extraPrice: number
  assetRef?: string
  metaJson?: string
}

export type CustomOptionGroup = {
  id: number
  name: string
  required: boolean
  multiSelect: boolean
  selectionLimit?: number
  options: CustomOption[]
}

export type CustomBaseProduct = {
  id: number
  name: string
  description?: string
  categoryId: number
  basePrice: number
  status: string
  angles: CustomBaseAngle[]
  optionGroups: CustomOptionGroup[]
}

export type CreateCustomDesignRequest = {
  customBaseProductId: number
  snapshotPrice: number
  previewImageUrl?: string
  payloadJson: string
}

export class CustomService {
  private static readonly BASE = '/api/custom'

  static async listBaseProducts(categoryId?: number): Promise<CustomBaseProduct[]> {
    const url = categoryId ? `${this.BASE}/base-products?categoryId=${categoryId}` : `${this.BASE}/base-products`
    return await apiClient.get<CustomBaseProduct[]>(url)
  }

  static async getBaseProduct(id: number): Promise<CustomBaseProduct> {
    return await apiClient.get<CustomBaseProduct>(`${this.BASE}/base-products/${id}`)
  }

  static async createDesign(payload: CreateCustomDesignRequest): Promise<{ id: string }> {
    const res = await apiClient.post<{ id: string }>(`${this.BASE}/designs`, payload)
    return res
  }
}

export default CustomService
