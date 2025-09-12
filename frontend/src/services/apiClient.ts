import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7146'

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
        console.log('🌐 [ApiClient] Making request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          data: config.data,
          headers: config.headers
        });
        
        // Add JWT token to requests if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('🔐 [ApiClient] Added auth token to request');
        } else {
          console.log('⚠️ [ApiClient] No auth token found');
        }
        
        return config
      },
      (error: any) => {
        console.error('❌ [ApiClient] Request error:', error);
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ [ApiClient] Response received:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data
        });
        return response
      },
      (error: any) => {
        console.error('❌ [ApiClient] Response error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message
        });
        
        // Handle 401 Unauthorized - clear auth data and redirect to login
        if (error.response?.status === 401) {
          console.log('🔐 [ApiClient] 401 Unauthorized - clearing auth data');
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            console.log('🔄 [ApiClient] Redirecting to login page');
            window.location.href = '/login'
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  private unwrapResponse<T>(response: AxiosResponse<any>): T {
    const payload = response.data
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as any).data as T
    }
    return payload as T
  }

  async get<T>(url: string): Promise<T> {
    console.log(`🔍 [ApiClient] GET request to: ${url}`);
    const response = await this.axiosInstance.get(url)
    const result = this.unwrapResponse<T>(response);
    console.log(`🔍 [ApiClient] GET response from ${url}:`, result);
    return result;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    console.log(`📤 [ApiClient] POST request to: ${url}`, data);
    const response = await this.axiosInstance.post(url, data)
    const result = this.unwrapResponse<T>(response);
    console.log(`📤 [ApiClient] POST response from ${url}:`, result);
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
    console.log(`🔄 [ApiClient] PUT request to: ${url}`, data);
    const response = await this.axiosInstance.put(url, data)
    const result = this.unwrapResponse<T>(response);
    console.log(`🔄 [ApiClient] PUT response from ${url}:`, result);
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
    console.log(`🗑️ [ApiClient] DELETE request to: ${url}`);
    const response = await this.axiosInstance.delete(url)
    const result = this.unwrapResponse<T>(response);
    console.log(`🗑️ [ApiClient] DELETE response from ${url}:`, result);
    return result;
  }
}

export const apiClient = new ApiClient()
