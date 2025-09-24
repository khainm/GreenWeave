import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchLoadingOverlayProps {
  isVisible: boolean
}

const SearchLoadingOverlay: React.FC<SearchLoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
        <span className="text-sm text-gray-600">Đang tìm kiếm...</span>
      </div>
    </div>
  )
}

export default SearchLoadingOverlay
