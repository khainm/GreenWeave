import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../../types/product'
import { formatVnd } from '../../../utils/format'

interface ProductTableRowProps {
  product: Product
  categoryMeta: Record<string, { isCustomizable: boolean }>
  getProductType: (product: Product, categoryMeta: Record<string, { isCustomizable: boolean }>) => 'regular' | 'custom'
  onDelete: (id: number) => void
  onEditCustom: (product: Product) => void
}

const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  categoryMeta,
  getProductType,
  onDelete,
  onEditCustom
}) => {
  const handleDelete = () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    onDelete(product.id)
  }

  const productType = getProductType(product, categoryMeta)

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 px-6 text-gray-700 font-medium">{product.sku}</td>
      <td className="py-4 px-6 font-semibold text-gray-900">{product.name}</td>
      <td className="py-4 px-6 text-gray-600">{product.category}</td>
      <td className="py-4 px-6 text-gray-700">{product.stock}</td>
      <td className="py-4 px-6 text-gray-700">{product.weight} g</td>
      <td className="py-4 px-6 text-gray-600">
        {product.primaryWarehouseName ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {product.primaryWarehouseName}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">Chưa chọn</span>
        )}
      </td>
      <td className="py-4 px-6">
        {productType === 'custom' ? (
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tùy chỉnh
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Thường
          </span>
        )}
      </td>
      <td className="py-4 px-6">
        {categoryMeta[product.category]?.isCustomizable ? (
          <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">Có</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">Không</span>
        )}
      </td>
      <td className="py-4 px-6 text-gray-900 font-bold">{formatVnd(product.price)} đ</td>
      <td className="py-4 px-6">
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
        </span>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {productType === 'custom' ? (
            <button
              onClick={() => onEditCustom(product)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Sửa tùy chỉnh
            </button>
          ) : (
            <Link 
              to={`/admin/products/edit/${product.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sửa
            </Link>
          )}
          <button 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  )
}

export default ProductTableRow