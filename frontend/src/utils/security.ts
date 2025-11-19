import DOMPurify from 'dompurify';
import { logger } from './logger';

/**
 * Security utility functions for the frontend
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  html: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
    allowLinks?: boolean;
  }
): string => {
  const defaultConfig: any = {
    ALLOWED_TAGS: options?.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'span', 'div'
    ],
    ALLOWED_ATTR: options?.allowedAttributes || ['class', 'id'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    RETURN_TRUSTED_TYPE: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  // Add link support if requested
  if (options?.allowLinks) {
    defaultConfig.ALLOWED_TAGS?.push('a');
    defaultConfig.ALLOWED_ATTR?.push('href', 'target', 'rel');
    defaultConfig.ADD_ATTR = ['target', 'rel'];
  }

  const sanitized = DOMPurify.sanitize(html, defaultConfig);
  return typeof sanitized === 'string' ? sanitized : String(sanitized);
};

/**
 * Sanitize text content for display (escapes HTML entities)
 * @param text - Raw text string
 * @returns HTML-escaped string
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Validate and sanitize URL to prevent javascript: and data: protocols
 * @param url - URL to validate
 * @returns Safe URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  const trimmedUrl = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmedUrl.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      logger.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return '';
    }
  }

  // Only allow http, https, and relative URLs
  if (!lowerUrl.startsWith('http://') && 
      !lowerUrl.startsWith('https://') && 
      !lowerUrl.startsWith('/') && 
      !lowerUrl.startsWith('#')) {
    logger.warn(`Invalid URL format: ${trimmedUrl}`);
    return '';
  }

  return trimmedUrl;
};

/**
 * Create a safe link element with proper security attributes
 * @param url - Link URL
 * @param text - Link text
 * @param openInNewTab - Whether to open in new tab
 * @returns Safe HTML string for link
 */
export const createSafeLink = (url: string, text: string, openInNewTab = false): string => {
  const safeUrl = sanitizeUrl(url);
  const safeText = escapeHtml(text);
  
  if (!safeUrl) {
    return safeText; // Return as plain text if URL is invalid
  }

  const target = openInNewTab ? ' target="_blank"' : '';
  const rel = openInNewTab ? ' rel="noopener noreferrer"' : '';
  
  return `<a href="${safeUrl}"${target}${rel}>${safeText}</a>`;
};

/**
 * Validate file upload before sending to server
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const maxSizeMB = options.maxSizeMB || 5;
  const allowedTypes = options.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Generate a Content Security Policy nonce for inline scripts
 * Note: This should be coordinated with backend CSP headers
 */
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if a string contains potential XSS patterns
 * This is a basic check and should not be relied upon as the only defense
 */
export const detectXSSPatterns = (input: string): boolean => {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi, // CSS expression
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};
