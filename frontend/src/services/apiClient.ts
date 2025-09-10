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
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`)
        return config
      },
      (error: any) => {
        console.error('Request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`Response from ${response.config.url}:`, response.status)
        return response
      },
      (error: any) => {
        console.error('Response error:', error.response?.data || error.message)
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
    const response = await this.axiosInstance.get(url)
    return this.unwrapResponse<T>(response)
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post(url, data)
    return this.unwrapResponse<T>(response)
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
    const response = await this.axiosInstance.put(url, data)
    return this.unwrapResponse<T>(response)
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
    const response = await this.axiosInstance.delete(url)
    return this.unwrapResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
