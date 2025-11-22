// 🎨 Type definitions for Custom Product Designer
// Senior Frontend Engineer - Production Ready Types

export interface ProductResponseDto {
  stickers: any;
  id: number;
  name: string;
  sku: string;
  category: string;
  description?: string;
  price?: number; // Optional for custom products
  originalPrice?: number;
  stock?: number; // Optional for custom products
  weight?: number; // Optional for custom products
  status: string;
  primaryWarehouseId?: string;
  primaryWarehouseName?: string;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDto[];
  colors: ProductColorDto[];
  // Stickers removed - using external Sticker Library instead
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
  colorName: string;
  colorCode: string;
  stock: number;
}

// Removed: ProductStickerDto - Stickers moved to external Sticker Library

// 🎯 Canvas design elements - Core types for Konva.js integration
export interface DesignElement {
  id: string;
  type: 'image' | 'text' | 'sticker'; // Added 'sticker' back for Giphy integration
  x: number;
  y: number;
  width?: number; // Optional for text elements
  height?: number; // Optional for text elements
  rotation: number;
  scaleX: number;
  scaleY: number;
  src?: string; // For images
  text?: string; // For text elements
  fontSize?: number;
  fontFamily?: string;
  fill?: string; // Text color
  fontWeight?: string; // Text weight: normal, bold
  fontStyle?: string; // Text style: normal, italic
  align?: string; // Text alignment: left, center, right
  curveAmount?: number; // Text curve: -100 (down) to 100 (up)
  letterSpacing?: number; // Letter spacing: 0-50px
  zIndex: number;
  createdAt: Date;
  opacity?: number;
  visible?: boolean;
}

// 📐 Complete design data structure
export interface CustomDesign {
  productId: number;
  selectedColorCode?: string;
  elements: DesignElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage?: string;
  metadata?: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    totalElements: number;
  };
}

// 📞 Contact information for consultation requests
export interface ContactInfo {
  phone?: string;
  zalo?: string;
  facebook?: string;
  preferredContact: 'phone' | 'zalo' | 'facebook';
  customerName?: string;
  notes?: string;
  email?: string;
}

// 📤 Upload response from backend
export interface UploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

// 🔧 Tool and interaction types
export type UploadMode = 'image'; // Removed 'sticker' - use external Sticker Library
export type ToolType = 'select' | 'image' | 'text' | 'move' | 'delete'; // Removed 'sticker'

// 🎮 Canvas interaction state
export interface CanvasState {
  selectedElementIds: string[];
  activeTool: ToolType;
  isDrawing: boolean;
  scale: number;
  panX: number;
  panY: number;
  history: CustomDesign[];
  historyIndex: number;
}

// 🌐 API response format (matches backend)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// 💾 Save design request to backend
export interface SaveDesignRequest {
  productId: number;
  designJson: string;
  previewUrl?: string;
  userId?: string;
}

// 🎯 Consultation request (for products without price)
export interface ConsultationRequest {
  designId?: string;
  contactInfo: ContactInfo;
  productId: number;
  designPreview?: string;
  productName?: string;
  estimatedPrice?: number;
}

// 📱 Contact form validation
export interface ContactFormErrors {
  phone?: string;
  zalo?: string;
  facebook?: string;
  customerName?: string;
  preferredContact?: string;
}

// 🎨 Text element specific properties
export interface TextElementProps {
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// 🖼️ Image element specific properties  
export interface ImageElementProps {
  src: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  filters?: string[];
}

// ⚡ Performance and optimization
export interface PerformanceMetrics {
  renderTime: number;
  elementCount: number;
  canvasSize: number;
  memoryUsage?: number;
}

// 🔄 History management for undo/redo
export interface HistoryEntry {
  design: CustomDesign;
  action: string;
  timestamp: Date;
}