import { useState, useCallback, useRef } from 'react'
import { ProductSearchService, type ProductSearchRequest } from '../services/productSearchService'
import type { Product } from '../types/product'

interface UseProductSearchProps {
  initialProducts: Product[]
}

export const useProductSearch = ({ initialProducts }: UseProductSearchProps) => {
  const [searchResults, setSearchResults] = useState<Product[]>(initialProducts)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Ref để tránh race condition
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentSearchRef = useRef<string | null>(null)
  const isSearchingRef = useRef<boolean>(false)

  const performSearch = useCallback(async (searchRequest: ProductSearchRequest) => {
    const searchKey = JSON.stringify(searchRequest)
    
    // Nếu đang có search khác đang chạy, cancel nó
    if (currentSearchRef.current && currentSearchRef.current !== searchKey) {
      return
    }
    
    // Nếu đang search, không search tiếp
    if (isSearchingRef.current) {
      return
    }
    
    currentSearchRef.current = searchKey
    
    try {
      isSearchingRef.current = true
      setIsSearching(true)
      setSearchError(null)
      
      const response = await ProductSearchService.searchProducts(searchRequest)
      
      // Kiểm tra xem search này vẫn còn valid không
      if (currentSearchRef.current === searchKey) {
        if (response.isSuccess) {
          // Thêm delay nhỏ để UI mượt mà
          await new Promise(resolve => setTimeout(resolve, 150))
          setSearchResults(response.products)
          setHasSearched(true)
        } else {
          setSearchError('Không thể tìm kiếm sản phẩm')
          setSearchResults([])
        }
      }
    } catch (error) {
      if (currentSearchRef.current === searchKey) {
        setSearchError('Có lỗi xảy ra khi tìm kiếm')
        setSearchResults([])
      }
    } finally {
      if (currentSearchRef.current === searchKey) {
        isSearchingRef.current = false
        setIsSearching(false)
        currentSearchRef.current = null
      }
    }
  }, [])

  const debouncedSearch = useCallback((searchRequest: ProductSearchRequest, delay: number = 800) => {
    // Clear timeout cũ
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set timeout mới
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchRequest)
    }, delay)
  }, [performSearch])

  const clearSearch = useCallback(() => {
    // Clear timeout nếu có
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    setSearchResults(initialProducts)
    setHasSearched(false)
    setSearchError(null)
    setIsSearching(false)
    currentSearchRef.current = null
  }, [initialProducts])

  const quickSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      clearSearch()
      return
    }
    
    debouncedSearch({
      search: searchTerm,
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'asc'
    })
  }, [debouncedSearch, clearSearch])

  return {
    searchResults,
    isSearching,
    hasSearched,
    searchError,
    performSearch,
    debouncedSearch,
    clearSearch,
    quickSearch
  }
}
