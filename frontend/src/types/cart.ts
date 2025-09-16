export interface CartItem {
  id: number
  productId: number
  colorCode?: string
  quantity: number
  unitPrice: number
}

export interface Cart {
  id: string
  createdAt: string
  updatedAt: string
  items: CartItem[]
  total?: number
}


