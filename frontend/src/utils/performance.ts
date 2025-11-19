import { logger } from './logger';

/**
 * 🚀 Performance hints for better caching and faster loading
 */

// Add cache headers hint for API responses
export const getCacheHeaders = (ttlSeconds: number = 300) => ({
  'Cache-Control': `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
  'ETag': `"${Date.now()}"`,
});

// 🚀 Prefetch important resources
export const prefetchResources = () => {
  if (typeof window === 'undefined') return;

  // Prefetch API endpoints that are likely to be used
  const endpoints = [
    '/api/products',
    '/api/categories'
  ];

  endpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `${import.meta.env.VITE_API_BASE_URL || 'https://api.greenweave.vn'}${endpoint}`;
    document.head.appendChild(link);
  });

  logger.debug('🚀 [Performance] Prefetched API endpoints');
};

// 🚀 Add performance marks for monitoring
export const markPerformance = (name: string, detail?: any) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
    if (detail) {
      logger.debug(`⚡ [Performance] ${name}:`, detail);
    }
  }
};

// 🚀 Measure performance between two marks
export const measurePerformance = (name: string, startMark: string, endMark: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      logger.debug(`📊 [Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    } catch (error) {
      logger.warn(`⚠️ [Performance] Could not measure ${name}:`, error);
    }
  }
  return 0;
};

export default {
  getCacheHeaders,
  prefetchResources,
  markPerformance,
  measurePerformance
};