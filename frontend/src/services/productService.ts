import { apiClient } from './apiClient'
import type { Product, CreateProductRequest } from '../types/product'

// 🚀 Performance optimization: Add caching system
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ProductCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes for better performance
  private readonly AGGRESSIVE_TTL = 30 * 60 * 1000; // 30 minutes for stable data

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
    console.log(`📦 [ProductCache] Cached: ${key} (TTL: ${(ttl || this.DEFAULT_TTL) / 1000}s)`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`🗑️ [ProductCache] Expired: ${key}`);
      return null;
    }

    console.log(`✅ [ProductCache] Hit: ${key} (age: ${((Date.now() - entry.timestamp) / 1000).toFixed(1)}s)`);
    return entry.data as T;
  }

  // 🚀 OPTIMIZATION: Background refresh for hot data
  async getOrRefresh<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached) {
      // 🚀 Background refresh if cache is older than 50% of TTL
      const entry = this.cache.get(key);
      const age = Date.now() - entry!.timestamp;
      const refreshThreshold = (ttl || this.DEFAULT_TTL) * 0.5;
      
      if (age > refreshThreshold) {
        console.log(`🔄 [ProductCache] Background refresh: ${key}`);
        // Fire and forget - don't await
        fetcher()
          .then(data => this.set(key, data, ttl))
          .catch(err => console.warn(`🚫 [ProductCache] Background refresh failed: ${key}`, err));
      }
      
      return cached;
    }

    // No cache, fetch fresh
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🔄 [ProductCache] Invalidated: ${key}`);
  }

  invalidateAll(): void {
    this.cache.clear();
    console.log(`🔄 [ProductCache] Cleared all cache`);
  }

  // Invalidate products by pattern
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        console.log(`🔄 [ProductCache] Pattern invalidated: ${key}`);
      }
    }
  }

  // 🚀 OPTIMIZATION: Preload commonly accessed data
  async preloadCommonData(): Promise<void> {
    try {
      console.log('🚀 [ProductCache] Preloading common data...');
      const startTime = performance.now();
      
      // Preload in parallel without waiting
      Promise.all([
        this.getOrRefresh('all_products', () => apiClient.get<Product[]>('/api/products'), this.AGGRESSIVE_TTL),
        this.getOrRefresh('categories', () => apiClient.get<any[]>('/api/categories'), this.AGGRESSIVE_TTL)
      ]).then(() => {
        const endTime = performance.now();
        console.log(`✅ [ProductCache] Preload completed in ${(endTime - startTime).toFixed(2)}ms`);
      }).catch(err => {
        console.warn('🚫 [ProductCache] Preload failed:', err);
      });
    } catch (error) {
      console.warn('🚫 [ProductCache] Preload error:', error);
    }
  }
}

const productCache = new ProductCache();

export class ProductService {
  private static readonly BASE_PATH = '/api/products'

  private static buildFormData(productData: CreateProductRequest): FormData {
    const formData = new FormData()
    
    // Required fields for all products
    formData.append('Name', productData.name)
    formData.append('Sku', productData.sku)
    formData.append('Category', productData.category)
    formData.append('Status', productData.status)
    
    // Optional fields for regular products (có price = regular product)
    if (productData.price !== undefined && productData.price !== null) {
      formData.append('Price', productData.price.toString())
    }
    if (productData.stock !== undefined && productData.stock !== null) {
      formData.append('Stock', productData.stock.toString())
    }
    if (productData.weight !== undefined && productData.weight !== null) {
      formData.append('Weight', productData.weight.toString())
    }
    if (productData.primaryWarehouseId) {
      formData.append('PrimaryWarehouseId', productData.primaryWarehouseId)
    }
    
    // Optional field for custom products
    if (productData.consultationNote) {
      formData.append('ConsultationNote', productData.consultationNote)
    }
    
    // Debug logging
    console.log('🔍 ProductService - buildFormData:', {
      name: productData.name,
      price: productData.price,
      weight: productData.weight,
      stock: productData.stock,
      consultationNote: productData.consultationNote,
      primaryWarehouseId: productData.primaryWarehouseId
    })
    if (productData.description) formData.append('Description', productData.description)
    if (productData.originalPrice) formData.append('OriginalPrice', productData.originalPrice.toString())
    if (productData.colors?.length) {
      productData.colors.forEach((color, index) => formData.append(`Colors[${index}]`, color))
    }
    if (productData.imageUrls?.length) {
      productData.imageUrls.forEach((url, index) => formData.append(`ImageUrls[${index}]`, url))
    }
    if (productData.imageFiles?.length) {
      productData.imageFiles.forEach(file => formData.append('ImageFiles', file))
    }
    // Note: Backend tự động map ảnh với màu theo thứ tự upload
    // Ảnh đầu tiên = ảnh chính, các ảnh tiếp theo tương ứng với từng màu
    
    return formData
  }

  // 🚀 Ultra-fast product loading with aggressive caching
  static async getAllProducts(useCache: boolean = true): Promise<Product[]> {
    try {
      const cacheKey = 'all_products';
      
      if (useCache) {
        // 🚀 Use enhanced cache with background refresh
        return await productCache.getOrRefresh(
          cacheKey,
          () => {
            console.log('🌐 [ProductService] Fetching products from API');
            return apiClient.get<Product[]>(this.BASE_PATH);
          },
          productCache['AGGRESSIVE_TTL'] // 30 minutes for product data
        );
      }
      
      // Force fresh fetch
      console.log('🌐 [ProductService] Force fetching products from API');
      const products = await apiClient.get<Product[]>(this.BASE_PATH);
      
      // Cache the result even if useCache is false
      productCache.set(cacheKey, products, productCache['AGGRESSIVE_TTL']);
      
      return products;
    } catch (error) {
      console.error('❌ [ProductService] Error fetching products:', error);
      
      // 🚀 FALLBACK: Try to return stale cache on error
      const staleData = productCache.get<Product[]>('all_products');
      if (staleData) {
        console.log('🚑 [ProductService] Returning stale cache due to error');
        return staleData;
      }
      
      throw error;
    }
  }

  // 🚀 Cache management methods
  static invalidateCache(): void {
    productCache.invalidateAll();
  }

  static invalidateProductCache(productId?: number): void {
    if (productId) {
      productCache.invalidatePattern(new RegExp(`product_${productId}`));
    }
    productCache.invalidatePattern(/^all_products/);
  }

  // 🚀 OPTIMIZATION: Preload data for instant access
  static preloadData(): void {
    productCache.preloadCommonData();
  }

  static refreshProduct(productId: number, newStock: number): void {
    // Update cached products with new stock
    const allProducts = productCache.get<Product[]>('all_products');
    if (allProducts) {
      const updated = allProducts.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      );
      productCache.set('all_products', updated);
    }
    
    console.log(`🔄 [ProductService] Updated product ${productId} stock to ${newStock}`);
  }

  // Lấy sản phẩm theo ID
  static async getProductById(id: number): Promise<Product> {
    try {
      return await apiClient.get<Product>(`${this.BASE_PATH}/${id}`)
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  // Lấy sản phẩm theo SKU
  static async getProductBySku(sku: string): Promise<Product> {
    try {
      return await apiClient.get<Product>(`${this.BASE_PATH}/sku/${sku}`)
    } catch (error) {
      console.error('Error fetching product by SKU:', error)
      throw error
    }
  }

  // Tạo sản phẩm mới
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const formData = this.buildFormData(productData)
      const newProduct = await apiClient.postForm<Product>(this.BASE_PATH, formData)
      
      // 🚀 AUTO-INVALIDATE: Clear cache sau khi tạo sản phẩm thành công
      this.invalidateCache()
      console.log('✅ [ProductService] Cache auto-invalidated after product creation')
      
      return newProduct
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  // Cập nhật sản phẩm
  static async updateProduct(id: number, productData: CreateProductRequest): Promise<Product> {
    try {
      const formData = this.buildFormData(productData)
      
      // Debug FormData content
      console.log('🔍 [ProductService] FormData content:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }
      
      const updatedProduct = await apiClient.putForm<Product>(`${this.BASE_PATH}/${id}`, formData)
      
      // 🚀 AUTO-INVALIDATE: Clear cache sau khi update sản phẩm thành công
      this.invalidateProductCache(id)
      console.log('✅ [ProductService] Cache auto-invalidated after product update')
      
      return updatedProduct
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  // Xóa sản phẩm
  static async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/${id}`)
      
      // 🚀 AUTO-INVALIDATE: Clear cache sau khi xóa sản phẩm thành công
      this.invalidateProductCache(id)
      console.log('✅ [ProductService] Cache auto-invalidated after product deletion')
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  // Tạo SKU tự động theo danh mục
  static generateSku(category: string): string {
    const prefixMap: Record<string, string> = {
      'Non-stop': 'NON',
      'Trơn': 'TRON', 
      'Thêu': 'THEU'
    }
    
    const prefix = prefixMap[category] || 'GW'
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}${randomNum}`
  }

  // Helper để convert file thành base64 để preview
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
}

// 🚀 OPTIMIZATION: Auto-preload on module import
// This runs as soon as the module is imported, preloading data
if (typeof window !== 'undefined') {
  // Only in browser environment
  setTimeout(() => {
    ProductService.preloadData();
  }, 100); // Small delay to not block initial page load
}

export default ProductService
