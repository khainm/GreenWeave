import type { Product } from '../../../types/product'

// Helper function to determine product type
export const getProductType = (
  product: Product, 
  categoryMeta: Record<string, { isCustomizable: boolean }>
): 'regular' | 'custom' => {
  // Product is custom if it has stickers OR if its category is customizable
  const hasStickers = product.stickers && product.stickers.length > 0
  const isCategoryCustomizable = categoryMeta[product.category]?.isCustomizable || false
  return (hasStickers || isCategoryCustomizable) ? 'custom' : 'regular'
}