import { useState, useEffect } from 'react'
import { customProductService, type CustomProduct, type CustomizationOptions } from '../services/customProductService'

/**
 * Hook to fetch all customizable products
 */
export function useCustomizableProducts() {
  const [products, setProducts] = useState<CustomProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await customProductService.getCustomizableProducts()
        setProducts(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customizable products')
        console.error('Error fetching customizable products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error, refetch: () => setLoading(true) }
}

/**
 * Hook to fetch a single customizable product by ID
 */
export function useCustomizableProduct(id: number | null) {
  const [product, setProduct] = useState<CustomProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const data = await customProductService.getCustomizableProductById(id)
        setProduct(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customizable product')
        console.error('Error fetching customizable product:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  return { product, loading, error }
}

/**
 * Hook to fetch customization options for a product
 */
export function useCustomizationOptions(productId: number | null) {
  const [options, setOptions] = useState<CustomizationOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const fetchOptions = async () => {
      try {
        setLoading(true)
        const data = await customProductService.getCustomizationOptions(productId)
        setOptions(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customization options')
        console.error('Error fetching customization options:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [productId])

  return { options, loading, error }
}

/**
 * Hook to check if a product is customizable
 */
export function useIsProductCustomizable(productId: number | null) {
  const [isCustomizable, setIsCustomizable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const checkCustomizable = async () => {
      try {
        setLoading(true)
        const result = await customProductService.isProductCustomizable(productId)
        setIsCustomizable(result)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to check if product is customizable')
        console.error('Error checking customizable status:', err)
      } finally {
        setLoading(false)
      }
    }

    checkCustomizable()
  }, [productId])

  return { isCustomizable, loading, error }
}
