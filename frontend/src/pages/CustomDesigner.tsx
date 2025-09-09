import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CustomService, { type CustomBaseProduct } from '../services/customService'
import { CartService, getOrCreateCartId } from '../services/cartService'
import PatternSelector from '../components/custom/PatternSelector'
import ColorSelector from '../components/custom/ColorSelector'
import CapPreview from '../components/custom/CapPreview'
import DesignTools from '../components/custom/DesignTools'


const CustomDesigner: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<CustomBaseProduct | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<string>('solid')
  const [selectedColor, setSelectedColor] = useState<string>('#10b981')
  const [activeAngle, setActiveAngle] = useState<string>('front')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const base = await CustomService.getBaseProduct(Number(id))
        setProduct(base)
      } catch (e) {
        setError('Không tải được sản phẩm tùy biến')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAngleChange = (angle: string) => {
    setActiveAngle(angle)
  }

  const handleSave = async () => {
    if (!product) return

    setIsSaving(true)
    try {
      const payload = {
        customBaseProductId: product.id,
        snapshotPrice: product.basePrice,
        previewImageUrl: undefined,
        payloadJson: JSON.stringify({
          selectedOptions: [],
          surcharges: [],
          selectedPattern,
          selectedColor,
          activeAngle
        })
      }

      await CustomService.createDesign(payload)
      // Just save design, don't add to cart yet
    } catch (error) {
      console.error('Error saving design:', error)
      setError('Có lỗi xảy ra khi lưu thiết kế')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOrder = async () => {
    if (!product) return

    setIsSaving(true)
    try {
      const payload = {
        customBaseProductId: product.id,
        snapshotPrice: product.basePrice,
        previewImageUrl: undefined,
        payloadJson: JSON.stringify({
          selectedOptions: [],
          surcharges: [],
          selectedPattern,
          selectedColor,
          activeAngle
        })
      }

      await CustomService.createDesign(payload)

      const cartId = await getOrCreateCartId()
      await CartService.addItem(cartId, {
        productId: product.id,
        quantity: 1,
        unitPrice: payload.snapshotPrice
      })

      window.dispatchEvent(new CustomEvent('cart:updated'))
      navigate('/cart')
    } catch (error) {
      console.error('Error ordering:', error)
      setError('Có lỗi xảy ra khi đặt hàng')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddText = () => {
    // TODO: Implement text addition
    console.log('Add text clicked')
  }

  const handleAddDesign = () => {
    // TODO: Implement design upload
    console.log('Add design clicked')
  }

  if (loading) return <div className="p-6">Đang tải...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!product) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600"></div>
            <h1 className="text-3xl font-bold text-gray-900">Thiết kế: {product.name}</h1>
            <div className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              TÙY BIẾN
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Sidebar - Pattern Selection */}
          <div className="xl:col-span-2">
            <PatternSelector
              selectedPattern={selectedPattern}
              onPatternSelect={setSelectedPattern}
            />
          </div>

          {/* Center - Cap Preview */}
          <div className="xl:col-span-8">
            <CapPreview
              selectedColor={selectedColor}
              selectedPattern={selectedPattern}
              onAngleChange={handleAngleChange}
            />
          </div>

          {/* Right Sidebar - Color Selection & Tools */}
          <div className="xl:col-span-2 space-y-6">
            <ColorSelector
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
            
            <DesignTools
              onAddText={handleAddText}
              onAddDesign={handleAddDesign}
              onSave={handleSave}
              onOrder={handleOrder}
              basePrice={product.basePrice}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomDesigner
