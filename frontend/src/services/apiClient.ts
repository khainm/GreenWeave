import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import logger from '../utils/logger'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.greenweave.vn'  
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7146'

// Debug: Log the API base URL (development only)
logger.log('🔧 [ApiClient] API_BASE_URL:', API_BASE_URL)
logger.log('🔧 [ApiClient] VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL) 


// API Response types
export interface ApiResponse<T> {
  data?: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  status: number
  details?: any
}

// Invoice-specific error types
export interface InvoiceError extends ApiError {
  invoiceId?: number
  orderId?: number
}

export class ApiException extends Error {
  public status: number
  public details?: any

  constructor(message: string, status: number, details?: any) {
    super(message)
    this.name = 'ApiException'
    this.status = status
    this.details = details
  }
}

class ApiClient {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // ⚠️ SECURITY: Only log in development, never log sensitive data in production
        if (import.meta.env.MODE === 'development') {
          logger.log('🌐 [ApiClient] Making request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullUrl: `${config.baseURL}${config.url}`,
            // Don't log data - may contain passwords
            hasData: !!config.data,
            // Don't log headers - contains auth tokens
            hasAuthHeader: !!config.headers.Authorization
          });
        }
        
        // Add JWT token to requests if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          logger.debug('🔐 [ApiClient] Added auth token to request');
        }
        // Note: No auth token is normal for login/public endpoints
        
        return config
      },
      (error: any) => {
        logger.error('❌ [ApiClient] Request error:', import.meta.env.MODE === 'development' ? error : 'Request failed');
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // ⚠️ SECURITY: Only log in development
        if (import.meta.env.MODE === 'development') {
          logger.log('✅ [ApiClient] Response received:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            // Don't log full data - may contain sensitive info
            hasData: !!response.data
          });
        }
        return response
      },
      (error: any) => {
        // ⚠️ SECURITY: Sanitize error logs in production
        if (import.meta.env.MODE === 'development') {
          logger.error('❌ [ApiClient] Response error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
            message: error.message
          });
        } else {
          logger.error(`API Error ${error.response?.status || 'Unknown'}`);
        }
        
        // 🔍 Log detailed error for 400 Bad Request (development only)
        if (error.response?.status === 400 && import.meta.env.MODE === 'development') {
          logger.error('⚠️ [ApiClient] 400 Bad Request - Full error details:', {
            url: error.config?.url,
            method: error.config?.method,
            responseData: error.response?.data,
            errors: error.response?.data?.errors,
            message: error.response?.data?.message
          });
        }
        
        // Handle 401 Unauthorized - clear auth data and redirect to login
        if (error.response?.status === 401) {
          logger.log('🔐 [ApiClient] 401 Unauthorized - clearing auth data');
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          // Only redirect if not already on login page and not on register page
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            logger.log('🔄 [ApiClient] Redirecting to login page');
            window.location.href = '/login'
          }
        }

        // Create standardized error response
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
          status: error.response?.status || 500,
          details: error.response?.data
        }

        // Handle specific invoice errors
        if (error.config?.url?.includes('/invoices')) {
          logger.error('🧾 [ApiClient] Invoice operation error');
          
          // Add invoice-specific error context
          const invoiceError: InvoiceError = {
            ...apiError,
            invoiceId: error.response?.data?.invoiceId,
            orderId: error.response?.data?.orderId
          }
          
          return Promise.reject(new ApiException(invoiceError.message, invoiceError.status, invoiceError))
        }

        // Handle email verification errors
        if (error.config?.url?.includes('/emailverification/')) {
          logger.error('📧 [ApiClient] Email verification error');
        }
        
        return Promise.reject(new ApiException(apiError.message, apiError.status, apiError))
      }
    )
  }

  private unwrapResponse<T>(response: AxiosResponse<any>): T {
    const payload = response.data
    // For Viettel Post address APIs, shipping APIs, and email verification APIs, don't unwrap the data property
    // because we need the full response structure with success, message, data, errors
    if (response.config?.url?.includes('/viettelpostaddress/') || 
        response.config?.url?.includes('/shipping/') ||
        response.config?.url?.includes('/emailverification/')) {
      return payload as T
    }
    
    // For other APIs, unwrap data property as before
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as any).data as T
    }
    return payload as T
  }

  async get<T>(url: string): Promise<T> {
    logger.debug(`🔍 [ApiClient] GET request to: ${url}`);
    const response = await this.axiosInstance.get(url)
    const result = this.unwrapResponse<T>(response);
    logger.debug(`🔍 [ApiClient] GET response from ${url}`);
    return result;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    logger.debug(`📤 [ApiClient] POST request to: ${url}`);
    const response = await this.axiosInstance.post(url, data)
    const result = this.unwrapResponse<T>(response);
    logger.debug(`📤 [ApiClient] POST response from ${url}`);
    return result;
  }

  async postForm<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return this.unwrapResponse<T>(response)
  }

  async put<T>(url: string, data?: any): Promise<T> {
    logger.debug(`🔄 [ApiClient] PUT request to: ${url}`);
    const response = await this.axiosInstance.put(url, data)
    const result = this.unwrapResponse<T>(response);
    logger.debug(`🔄 [ApiClient] PUT response from ${url}`);
    return result;
  }

  async putForm<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.axiosInstance.put(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return this.unwrapResponse<T>(response)
  }

  async delete<T>(url: string): Promise<T> {
    logger.debug(`🗑️ [ApiClient] DELETE request to: ${url}`);
    const response = await this.axiosInstance.delete(url)
    const result = this.unwrapResponse<T>(response);
    logger.debug(`🗑️ [ApiClient] DELETE response from ${url}`);
    return result;
  }
}

export const apiClient = new ApiClient()
