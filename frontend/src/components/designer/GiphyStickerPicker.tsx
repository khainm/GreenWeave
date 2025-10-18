import { useState, useEffect } from 'react'
import { useGiphySearch, useGiphyTrending } from '../../hooks/useGiphy'
import type { GiphySticker } from '../../services/giphyService'

interface GiphyStickerPickerProps {
  onStickerSelect: (sticker: GiphySticker) => void
  onClose: () => void
}

/**
 * Giphy Sticker Picker Component
 * Allows users to search and select stickers from Giphy for customization
 */
export default function GiphyStickerPicker({ onStickerSelect, onClose }: GiphyStickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState<'search' | 'trending'>('trending')
  const [currentOffset, setCurrentOffset] = useState(0)
  
  const { 
    stickers: searchStickers, 
    loading: searchLoading, 
    error: searchError,
    searchStickers: doSearch,
    loadMore,
    clearStickers 
  } = useGiphySearch()
  
  const { 
    stickers: trendingStickers, 
    loading: trendingLoading, 
    error: trendingError,
    fetchTrending 
  } = useGiphyTrending(24)

  // Load trending stickers on mount
  useEffect(() => {
    fetchTrending()
  }, [fetchTrending])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm!')
      return
    }
    
    setCurrentTab('search')
    setCurrentOffset(0)
    clearStickers()
    doSearch({ query: searchQuery, limit: 24, offset: 0 })
  }

  const handleLoadMore = () => {
    const newOffset = currentOffset + 24
    setCurrentOffset(newOffset)
    loadMore({ query: searchQuery, limit: 24, offset: newOffset })
  }

  const handleStickerClick = (sticker: GiphySticker) => {
    console.log('✅ Sticker selected:', sticker)
    onStickerSelect(sticker)
  }

  const displayStickers = currentTab === 'trending' ? trendingStickers : searchStickers
  const isLoading = currentTab === 'trending' ? trendingLoading : searchLoading
  const error = currentTab === 'trending' ? trendingError : searchError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧸</span>
              <h2 className="text-2xl font-bold">Giphy Sticker Picker</h2>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm sticker... (vd: happy cat, funny dog)"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄' : '🔍'} Tìm
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setCurrentTab('trending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'trending' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🔥 Trending
            </button>
            <button
              onClick={() => setCurrentTab('search')}
              disabled={searchStickers.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                currentTab === 'search' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🔍 Search Results {searchStickers.length > 0 && `(${searchStickers.length})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              ❌ {error}
            </div>
          )}

          {isLoading && displayStickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin text-6xl mb-4">🔄</div>
              <p className="text-gray-600">Đang tải stickers...</p>
            </div>
          ) : displayStickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <span className="text-6xl mb-4">🔍</span>
              <p className="text-lg">
                {currentTab === 'trending' 
                  ? 'Không có trending stickers' 
                  : 'Không tìm thấy sticker nào. Thử từ khóa khác!'}
              </p>
            </div>
          ) : (
            <>
              {/* Sticker Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerClick(sticker)}
                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden hover:ring-4 hover:ring-purple-400 transition-all duration-200 hover:scale-105"
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.title}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-medium truncate">
                          {sticker.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Load More Button */}
              {currentTab === 'search' && searchStickers.length > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '🔄 Đang tải...' : '⬇️ Xem thêm'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              Powered by <span className="font-semibold text-purple-600">GIPHY</span>
            </p>
            <p>
              {displayStickers.length} stickers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
