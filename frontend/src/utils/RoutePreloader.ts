import { ProductService } from '../services/productService';
import CategoryService from '../services/categoryService';

/**
 * 🚀 Route-based preloader for ultra-fast page navigation
 * Preloads data when user navigates to routes that need it
 */
export class RoutePreloader {
  private static preloadPromises = new Map<string, Promise<any>>();

  // 🚀 Preload products page data
  static preloadProductsPage(): Promise<[any, any]> {
    const key = 'products-page';
    
    if (!this.preloadPromises.has(key)) {
      console.log('🚀 [RoutePreloader] Starting products page preload...');
      const startTime = performance.now();
      
      const promise = Promise.all([
        ProductService.getAllProducts(true),
        CategoryService.list(true)
      ]).then((results) => {
        const endTime = performance.now();
        console.log(`✅ [RoutePreloader] Products page preloaded in ${(endTime - startTime).toFixed(2)}ms`);
        return results;
      }).catch((error) => {
        console.warn('🚫 [RoutePreloader] Products page preload failed:', error);
        // Remove failed promise from cache so it can be retried
        this.preloadPromises.delete(key);
        throw error;
      });
      
      this.preloadPromises.set(key, promise);
    }
    
    return this.preloadPromises.get(key)!;
  }

  // 🚀 Preload custom design page data
  static preloadCustomDesignPage(): Promise<any> {
    const key = 'custom-design-page';
    
    if (!this.preloadPromises.has(key)) {
      console.log('🚀 [RoutePreloader] Starting custom design page preload...');
      const promise = ProductService.getCustomizableProducts(true)
        .then((result) => {
          console.log('✅ [RoutePreloader] Custom design page preloaded');
          return result;
        }).catch((error) => {
          console.warn('🚫 [RoutePreloader] Custom design page preload failed:', error);
          this.preloadPromises.delete(key);
          throw error;
        });
      
      this.preloadPromises.set(key, promise);
    }
    
    return this.preloadPromises.get(key)!;
  }

  // 🚀 Clear preload cache
  static clearCache(): void {
    this.preloadPromises.clear();
    console.log('🗑️ [RoutePreloader] Cache cleared');
  }

  // 🚀 Preload based on route name
  static preloadForRoute(routeName: string): Promise<any> | null {
    switch (routeName) {
      case 'products':
      case 'products-page':
        return this.preloadProductsPage();
      case 'custom-design':
      case 'designer':
        return this.preloadCustomDesignPage();
      default:
        return null;
    }
  }
}

// 🚀 Auto-preload on mouse hover over navigation links
export const setupNavigationPreloader = () => {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  const setupListeners = () => {
    // Preload products page on hover over products link
    const productLinks = document.querySelectorAll('a[href*="/products"], a[href*="/san-pham"]');
    productLinks.forEach(link => {
      let preloadTimeout: NodeJS.Timeout;
      
      link.addEventListener('mouseenter', () => {
        // Delay preload slightly to avoid preloading on accidental hovers
        preloadTimeout = setTimeout(() => {
          RoutePreloader.preloadProductsPage().catch(() => {
            // Ignore errors on hover preload
          });
        }, 300);
      });
      
      link.addEventListener('mouseleave', () => {
        clearTimeout(preloadTimeout);
      });
    });

    // Preload custom design page on hover over designer link
    const designerLinks = document.querySelectorAll('a[href*="/designer"], a[href*="/custom"]');
    designerLinks.forEach(link => {
      let preloadTimeout: NodeJS.Timeout;
      
      link.addEventListener('mouseenter', () => {
        preloadTimeout = setTimeout(() => {
          RoutePreloader.preloadCustomDesignPage().catch(() => {
            // Ignore errors on hover preload
          });
        }, 300);
      });
      
      link.addEventListener('mouseleave', () => {
        clearTimeout(preloadTimeout);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
};

export default RoutePreloader;