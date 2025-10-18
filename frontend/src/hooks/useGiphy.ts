import { useState, useCallback } from 'react'
import { giphyService, type GiphySticker, type GiphySearchParams } from '../services/giphyService'

/**
 * Hook for searching Giphy stickers
 */
export function useGiphySearch() {
  const [stickers, setStickers] = useState<GiphySticker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchStickers = useCallback(async (params: GiphySearchParams) => {
    setLoading(true)
    setError(null)

    try {
      const results = await giphyService.searchStickers(params)
      setStickers(results)
    } catch (err: any) {
      setError(err.message || 'Failed to search stickers')
      console.error('Error searching stickers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async (params: GiphySearchParams) => {
    setLoading(true)
    setError(null)

    try {
      const results = await giphyService.searchStickers(params)
      setStickers(prev => [...prev, ...results])
    } catch (err: any) {
      setError(err.message || 'Failed to load more stickers')
      console.error('Error loading more stickers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearStickers = useCallback(() => {
    setStickers([])
    setError(null)
  }, [])

  return {
    stickers,
    loading,
    error,
    searchStickers,
    loadMore,
    clearStickers,
  }
}

/**
 * Hook for getting trending Giphy stickers
 */
export function useGiphyTrending(limit: number = 12) {
  const [stickers, setStickers] = useState<GiphySticker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await giphyService.getTrendingStickers(limit)
      setStickers(results)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending stickers')
      console.error('Error fetching trending stickers:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  return {
    stickers,
    loading,
    error,
    fetchTrending,
  }
}
