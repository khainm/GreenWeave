import { apiClient } from './apiClient'
import type { Cart, CartItem } from '../types/cart'

const CART_ID_KEY = 'gw_cart_id'

export const getOrCreateCartId = async (): Promise<string> => {
  const existing = localStorage.getItem(CART_ID_KEY)
  if (existing) return existing
  const res = await apiClient.post<Cart>('/api/cart')
  const cartId = res.id
  localStorage.setItem(CART_ID_KEY, cartId)
  return cartId
}

// Helper function to force create a new cart
export const createNewCart = async (): Promise<string> => {
  const res = await apiClient.post<Cart>('/api/cart')
  const cartId = res.id
  localStorage.setItem(CART_ID_KEY, cartId)
  return cartId
}

export const getCartId = (): string | null => localStorage.getItem(CART_ID_KEY)
export const setCartId = (id: string) => localStorage.setItem(CART_ID_KEY, id)

export const CartService = {
  async get(cartId: string): Promise<Cart> {
    try {
      return await apiClient.get<Cart>(`/api/cart/${cartId}`)
    } catch (error: any) {
      // If cart not found, create a new cart and return it
      if (error.status === 404) {
        console.log('Cart not found, creating new cart...')
        const newCartId = await createNewCart()
        // Return the newly created cart
        return await apiClient.get<Cart>(`/api/cart/${newCartId}`)
      }
      throw error
    }
  },
  async addItem(cartId: string, payload: { productId: number; quantity: number; unitPrice: number; colorCode?: string }): Promise<CartItem> {
    try {
      return await apiClient.post<CartItem>(`/api/cart/${cartId}/items`, payload)
    } catch (error: any) {
      // If cart not found, create a new cart and try again
      if (error.status === 404) {
        console.log('Cart not found, creating new cart...')
        const newCartId = await createNewCart()
        return await apiClient.post<CartItem>(`/api/cart/${newCartId}/items`, payload)
      }
      throw error
    }
  },
  async updateItem(cartId: string, itemId: number, quantity: number): Promise<CartItem> {
    return await apiClient.put<CartItem>(`/api/cart/${cartId}/items/${itemId}`, { quantity })
  },
  async removeItem(cartId: string, itemId: number): Promise<void> {
    await apiClient.delete<void>(`/api/cart/${cartId}/items/${itemId}`)
  },
  async assignToUser(cartId: string, userId: string): Promise<Cart> {
    return await apiClient.put<Cart>(`/api/cart/${cartId}/assign-user`, { userId })
  },
  async getUserCart(userId: string): Promise<Cart | null> {
    try {
      return await apiClient.get<Cart>(`/api/cart/user/${userId}`)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }
}

// Utility function to handle cart assignment when user logs in
export const handleUserLogin = async (userId: string): Promise<string> => {
  const anonymousCartId = getCartId()
  
  // Check if user already has a cart
  const existingUserCart = await CartService.getUserCart(userId)
  
  if (anonymousCartId && !existingUserCart) {
    // Assign anonymous cart to the user
    await CartService.assignToUser(anonymousCartId, userId)
    return anonymousCartId
  } else if (existingUserCart) {
    // User has existing cart, use that
    setCartId(existingUserCart.id)
    return existingUserCart.id
  } else {
    // No anonymous cart and no user cart, current cart ID is fine
    return anonymousCartId || await getOrCreateCartId()
  }
}


