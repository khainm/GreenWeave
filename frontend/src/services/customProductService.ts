// 🎨 Custom Product Designer Service
// Senior Frontend Engineer - Production Ready API Service

import { apiClient } from './apiClient';
import type { 
  ProductResponseDto, 
  UploadResponse, 
  CustomDesign,
  SaveDesignRequest,
  ConsultationRequest,
  ContactInfo
} from '../components/designer/types';

export class CustomProductService {
  private static readonly BASE_PATH = '/api/customdesigns';
  private static readonly CONSULTATION_PATH = '/api/consultation-request';

  // 🛍️ Get customizable products with enhanced error handling
  static async getCustomizableProducts(): Promise<ProductResponseDto[]> {
    try {
      console.log('🛍️ [CustomProductService] Fetching customizable products...');
      const response = await apiClient.get<ProductResponseDto[]>('/api/CustomProducts');
      
      console.log('🛍️ [CustomProductService] Response received:', response);
      
      // Handle backend response format { success: true, data: [...] }
      let products: ProductResponseDto[] = [];
      if (response && typeof response === 'object' && 'data' in response) {
        products = Array.isArray((response as any).data) ? (response as any).data : [];
      } else if (Array.isArray(response)) {
        products = response;
      }
      
      console.log('🛍️ [CustomProductService] Products extracted:', products.length);
      
      // Validate each product has required fields (price is optional for custom products)
      const validProducts = products.filter(product => 
        product && 
        product.id && 
        product.name
      );
      
      console.log('🛍️ [CustomProductService] Valid products:', validProducts.length);
      return validProducts;
    } catch (error) {
      console.error('❌ [CustomProductService] Error fetching products:', error);
      // Return empty array to prevent UI crashes
      return [];
    }
  }

  // 🎯 Get specific customizable product by ID
  static async getCustomizableProductById(id: number): Promise<ProductResponseDto | null> {
    try {
      console.log(`🛍️ [CustomProductService] Fetching product ${id}...`);
      const response = await apiClient.get<ProductResponseDto>(`/api/CustomProducts/${id}`);
      
      if (!response || !response.id) {
        throw new Error('Invalid product data received');
      }
      
      console.log('🛍️ [CustomProductService] Product details:', response.name);
      return response;
    } catch (error) {
      console.error('❌ [CustomProductService] Error fetching product:', error);
      return null;
    }
  }

  // 📤 Upload image with progress tracking
  static async uploadImage(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      console.log('📤 [CustomProductService] Uploading image:', file.name, file.size);
      
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file');
      }
      
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('category', 'custom-design');

      // Use postForm method 
      const response = await apiClient.postForm<UploadResponse>('/api/upload', formData);
      
      // Track progress if callback provided
      if (onProgress) {
        onProgress(100);
      }
      
      console.log('📤 [CustomProductService] Upload successful:', response.url);
      return response;
    } catch (error) {
      console.error('❌ [CustomProductService] Upload failed:', error);
      throw error;
    }
  }

  // 💾 Save custom design to backend
  static async saveCustomDesign(design: CustomDesign, previewUrl?: string): Promise<string> {
    try {
      console.log('💾 [CustomProductService] Saving design...', {
        productId: design.productId,
        elementCount: design.elements.length,
        hasPreview: !!previewUrl
      });
      
      const request: SaveDesignRequest = {
        productId: design.productId,
        designJson: JSON.stringify(design),
        previewUrl,
        userId: this.getCurrentUserId()
      };

      const response = await apiClient.post<{ designId: string }>(
        this.BASE_PATH,
        request
      );
      
      if (!response?.designId) {
        throw new Error('Invalid response from server');
      }
      
      console.log('💾 [CustomProductService] Design saved:', response.designId);
      return response.designId;
    } catch (error) {
      console.error('❌ [CustomProductService] Save failed:', error);
      throw error;
    }
  }

  // 📖 Load saved design from backend
  static async loadCustomDesign(designId: string): Promise<CustomDesign | null> {
    try {
      console.log('📖 [CustomProductService] Loading design:', designId);
      
      const response = await apiClient.get<{
        designJson: string;
        productId: number;
        createdAt: string;
      }>(`${this.BASE_PATH}/${designId}`);
      
      if (!response?.designJson) {
        throw new Error('Design not found');
      }
      
      const design: CustomDesign = JSON.parse(response.designJson);
      
      // Validate design structure
      if (!design.productId || !Array.isArray(design.elements)) {
        throw new Error('Invalid design format');
      }
      
      console.log('📖 [CustomProductService] Design loaded:', design.elements.length, 'elements');
      return design;
    } catch (error) {
      console.error('❌ [CustomProductService] Load failed:', error);
      return null;
    }
  }

  // 📞 Create consultation request (for products without price)
  static async createConsultationRequest(request: ConsultationRequest): Promise<string> {
    try {
      console.log('📞 [CustomProductService] Creating consultation request...', {
        productId: request.productId,
        contact: request.contactInfo.preferredContact,
        hasDesign: !!request.designId
      });
      
      // Validate contact info
      this.validateContactInfo(request.contactInfo);
      
      const response = await apiClient.post<{ requestId: string }>(
        this.CONSULTATION_PATH,
        request
      );
      
      if (!response?.requestId) {
        throw new Error('Failed to create consultation request');
      }
      
      console.log('📞 [CustomProductService] Consultation request created:', response.requestId);
      return response.requestId;
    } catch (error) {
      console.error('❌ [CustomProductService] Consultation request failed:', error);
      throw error;
    }
  }

  // 🔍 Validate contact information
  private static validateContactInfo(contactInfo: ContactInfo): void {
    const { preferredContact, phone, zalo, facebook, customerName } = contactInfo;
    
    if (!customerName || customerName.trim().length === 0) {
      throw new Error('Customer name is required');
    }
    
    switch (preferredContact) {
      case 'phone':
        if (!phone || !/^[0-9+\-\s()]{10,15}$/.test(phone)) {
          throw new Error('Valid phone number is required');
        }
        break;
      case 'zalo':
        if (!zalo || zalo.trim().length === 0) {
          throw new Error('Zalo contact is required');
        }
        break;
      case 'facebook':
        if (!facebook || facebook.trim().length === 0) {
          throw new Error('Facebook contact is required');
        }
        break;
      default:
        throw new Error('Preferred contact method is required');
    }
  }

  // 👤 Get current user ID (from auth context or localStorage)
  private static getCurrentUserId(): string {
    // TODO: Integrate with your authentication system
    let userId = localStorage.getItem('customDesignUserId');
    if (!userId) {
      userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('customDesignUserId', userId);
    }
    return userId;
  }

  // 📊 Get design statistics
  static getDesignStats(design: CustomDesign) {
    return {
      elementCount: design.elements.length,
      imageCount: design.elements.filter(e => e.type === 'image').length,
      textCount: design.elements.filter(e => e.type === 'text').length,
      // Removed: stickerCount - Stickers moved to external Sticker Library
      canvasSize: design.canvasWidth * design.canvasHeight,
      estimatedComplexity: this.calculateComplexity(design)
    };
  }

  // 🧮 Calculate design complexity for performance optimization
  private static calculateComplexity(design: CustomDesign): 'low' | 'medium' | 'high' {
    const elementCount = design.elements.length;
    const canvasSize = design.canvasWidth * design.canvasHeight;
    
    if (elementCount <= 5 && canvasSize <= 500000) return 'low';
    if (elementCount <= 15 && canvasSize <= 1000000) return 'medium';
    return 'high';
  }

  // 🤖 Gemini AI Preview Generation
  static async generateGeminiPreview(imageBlob: Blob): Promise<{
    success: boolean;
    data?: {
      originalUrl: string;
      cartoonUrl: string;
      cutoutUrl: string;
    };
    message?: string;
  }> {
    try {
      console.log('🤖 [CustomProductService] Generating Gemini AI preview...');
      
      const formData = new FormData();
      formData.append('image', imageBlob, 'design.png');

      const result = await apiClient.postForm<{
        success: boolean;
        data?: {
          originalUrl: string;
          cartoonUrl: string;
          cutoutUrl: string;
        };
        message?: string;
      }>('/api/geminipreview/generate', formData);
      
      console.log('🤖 [CustomProductService] Gemini preview generated:', result);
      return result;
    } catch (error) {
      console.error('❌ [CustomProductService] Gemini preview failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate AI preview'
      };
    }
  }

  // 🏥 Check Gemini Preview Service health
  static async checkGeminiHealth(): Promise<boolean> {
    try {
      console.log('🏥 [CustomProductService] Checking Gemini health...');
      const response = await apiClient.get<{ success: boolean; message?: string }>('/api/geminipreview/health');
      console.log('🏥 [CustomProductService] Gemini health response:', response);
      return response?.success === true;
    } catch (error) {
      console.warn('⚠️ [CustomProductService] Gemini service not available:', error);
      // Return false instead of throwing - Gemini is optional feature
      return false;
    }
  }
}