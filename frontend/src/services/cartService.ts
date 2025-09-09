import { apiClient } from './apiClient'
import type { Cart, CartItem } from '../types/cart'

const CART_ID_KEY = 'gw_cart_id'

export const getOrCreateCartId = async (): Promise<string> => {
  const existing = localStorage.getItem(CART_ID_KEY)
  if (existing) return existing
  const res = await apiClient.post<Cart>('/api/cart')
  const id = (res as any).id || (res as any).Id || (res as any).data?.id
  const cartId = id || (res as any).data?.Id
  localStorage.setItem(CART_ID_KEY, cartId)
  return cartId
}

export const getCartId = (): string | null => localStorage.getItem(CART_ID_KEY)
export const setCartId = (id: string) => localStorage.setItem(CART_ID_KEY, id)

export const CartService = {
  async get(cartId: string): Promise<Cart> {
    return await apiClient.get<Cart>(`/api/cart/${cartId}`)
  },
  async addItem(cartId: string, payload: { productId: number; quantity: number; unitPrice: number; colorCode?: string }): Promise<CartItem> {
    return await apiClient.post<CartItem>(`/api/cart/${cartId}/items`, payload)
  },
  async updateItem(cartId: string, itemId: number, quantity: number): Promise<CartItem> {
    return await apiClient.put<CartItem>(`/api/cart/${cartId}/items/${itemId}`, { quantity })
  },
  async removeItem(cartId: string, itemId: number): Promise<void> {
    await apiClient.delete<void>(`/api/cart/${cartId}/items/${itemId}`)
  }
}


