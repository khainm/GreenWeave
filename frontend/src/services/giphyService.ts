import axios from 'axios'

// ==========================================
// Giphy Service for Sticker Search
// ==========================================

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'fSdkdL1IDkQmXMk0zogspBK9iRVUIWS8'
const GIPHY_API_URL = 'https://api.giphy.com/v1/stickers/search'

export interface GiphySticker {
  id: string
  title: string
  url: string          // Static image URL (for preview)
  gifUrl?: string      // Original GIF URL (if needed)
  width?: number
  height?: number
  source?: string      // 'giphy' to identify source
}

export interface GiphySearchParams {
  query: string
  limit?: number
  offset?: number
  rating?: 'g' | 'pg' | 'pg-13' | 'r'
}

class GiphyService {
  /**
   * Search for static stickers from Giphy
   */
  async searchStickers(params: GiphySearchParams): Promise<GiphySticker[]> {
    const { query, limit = 12, offset = 0, rating = 'pg' } = params

    if (!query.trim()) {
      throw new Error('Search query is required')
    }

    console.log('🔍 [Giphy] Searching stickers:', { query, limit, rating })

    try {
      const response = await axios.get(GIPHY_API_URL, {
        params: {
          api_key: GIPHY_API_KEY,
          q: query,
          limit,
          offset,
          rating,
        },
        timeout: 10000, // 10 seconds timeout
      })

      if (!response.data.data || response.data.data.length === 0) {
        console.warn('⚠️ [Giphy] No stickers found for query:', query)
        return []
      }

      // Map Giphy response to our sticker format
      const stickers: GiphySticker[] = response.data.data.map((item: any) => {
        // Get the best static image URL
        const staticUrl = 
          item.images.original_still?.url ||
          item.images.downsized_still?.url ||
          item.images.fixed_width_still?.url ||
          item.images.preview_gif?.url

        return {
          id: item.id,
          title: item.title || 'Untitled Sticker',
          url: staticUrl,
          gifUrl: item.images.original?.url,
          width: parseInt(item.images.original?.width || '0'),
          height: parseInt(item.images.original?.height || '0'),
          source: 'giphy',
        }
      })

      console.log(`✅ [Giphy] Found ${stickers.length} stickers`)
      return stickers

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ [Giphy] API Error:', error.response?.data || error.message)
        throw new Error(`Failed to search stickers: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get trending stickers from Giphy
   */
  async getTrendingStickers(limit: number = 12): Promise<GiphySticker[]> {
    console.log('🔥 [Giphy] Fetching trending stickers')

    try {
      const response = await axios.get('https://api.giphy.com/v1/stickers/trending', {
        params: {
          api_key: GIPHY_API_KEY,
          limit,
          rating: 'pg',
        },
        timeout: 10000,
      })

      const stickers: GiphySticker[] = response.data.data.map((item: any) => {
        const staticUrl = 
          item.images.original_still?.url ||
          item.images.downsized_still?.url ||
          item.images.fixed_width_still?.url

        return {
          id: item.id,
          title: item.title || 'Trending Sticker',
          url: staticUrl,
          gifUrl: item.images.original?.url,
          width: parseInt(item.images.original?.width || '0'),
          height: parseInt(item.images.original?.height || '0'),
          source: 'giphy',
        }
      })

      console.log(`✅ [Giphy] Found ${stickers.length} trending stickers`)
      return stickers

    } catch (error) {
      console.error('❌ [Giphy] Failed to get trending stickers:', error)
      throw error
    }
  }

  /**
   * Download sticker as blob for upload to Cloudinary (optional)
   */
  async downloadStickerAsBlob(url: string): Promise<Blob> {
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
        timeout: 15000,
      })
      return response.data
    } catch (error) {
      console.error('❌ [Giphy] Failed to download sticker:', error)
      throw new Error('Failed to download sticker')
    }
  }
}

export const giphyService = new GiphyService()
