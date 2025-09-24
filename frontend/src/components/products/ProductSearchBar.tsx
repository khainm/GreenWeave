import React, { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ProductSearchService, type ProductSearchRequest } from '../../services/productSearchService'

interface ProductSearchBarProps {
  onSearchResults: (results: any[]) => void
  onLoading: (loading: boolean) => void
  categories: string[]
  onSearchRequest?: (request: ProductSearchRequest) => void
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onSearchResults,
  onLoading,
  categories,
  onSearchRequest
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search - tăng thời gian debounce để tránh request liên tiếp
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || selectedCategory || minPrice || maxPrice) {
        const searchRequest: ProductSearchRequest = {
          search: searchTerm || undefined,
          category: selectedCategory || undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          page: 1,
          pageSize: 20,
          sortBy: 'name',
          sortDirection: 'asc'
        }
        
        if (onSearchRequest) {
          onSearchRequest(searchRequest)
        } else {
          performSearch()
        }
      }
    }, 800) // Tăng từ 500ms lên 800ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, minPrice, maxPrice]) // Loại bỏ onSearchRequest khỏi dependency

  const performSearch = async () => {
    try {
      // Chỉ set loading nếu chưa đang search để tránh flicker
      if (!isSearching) {
        setIsSearching(true)
        onLoading(true)
      }

      const searchRequest: ProductSearchRequest = {
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        page: 1,
        pageSize: 20,
        sortBy: 'name',
        sortDirection: 'asc'
      }

      const response = await ProductSearchService.searchProducts(searchRequest)
      
      if (response.isSuccess) {
        // Thêm delay nhỏ để UI mượt mà hơn
        await new Promise(resolve => setTimeout(resolve, 100))
        onSearchResults(response.products)
      } else {
        onSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      onSearchResults([])
    } finally {
      setIsSearching(false)
      onLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setShowFilters(false)
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Bộ lọc
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá từ (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá đến (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </button>

              <div className="text-sm text-gray-500 flex items-center">
                {isSearching && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                    Đang tìm kiếm...
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSearchBar
