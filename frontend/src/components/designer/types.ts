// Type definitions for Custom Product Designer
export interface ProductResponseDto {
  id: number;
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  weight: number;
  status: string;
  primaryWarehouseId?: string;
  primaryWarehouseName?: string;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDto[];
  colors: ProductColorDto[];
  stickers: ProductStickerDto[];
  // ColorImageMap is computed property from backend, but we need it for type safety
  colorImageMap?: { [key: string]: string };
}

export interface ProductImageDto {
  id: number;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  colorCode?: string;
}

export interface ProductColorDto {
  id: number;
  colorCode: string;
  colorName?: string;
  sortOrder: number;
}

export interface ProductStickerDto {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface DesignElement {
  id: string;
  type: 'image' | 'sticker' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  src?: string;
  text?: string;
  color?: string;
  fontSize?: number;
}

export interface CustomDesign {
  productId: number;
  selectedColorCode?: string;
  elements: DesignElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
  };
  message?: string;
}

export type UploadMode = 'image' | 'sticker';