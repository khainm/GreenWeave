import React from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Product } from '../../types/product'

interface ProductSearchResultsProps {
  results: Product[]
  hasSearched: boolean
  isSearching: boolean
  onClearSearch: () => void
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  results,
  hasSearched,
  isSearching,
  onClearSearch
}) => {
  if (!hasSearched) {
    return null
  }

  return (
    <div className="bg-white border-b border-gray-200 transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Kết quả tìm kiếm
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500 mr-2"></div>
                    Đang tìm kiếm...
                  </>
                ) : (
                  `Tìm thấy ${results.length} sản phẩm`
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClearSearch}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Xóa tìm kiếm
          </button>
        </div>

        {!isSearching && results.length === 0 && (
          <div className="mt-4 text-center py-8">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Không tìm thấy sản phẩm
            </h3>
            <p className="text-gray-500">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSearchResults
