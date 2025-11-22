import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../../types/product'
import { formatVnd } from '../../../utils/format'

interface ProductTableRowProps {
  product: Product
  categoryMeta: Record<string, { isCustomizable: boolean }>
  getProductType: (product: Product, categoryMeta: Record<string, { isCustomizable: boolean }>) => 'regular' | 'custom'
  onDelete: (id: number) => void
  onEditCustom?: (product: Product) => void
}

const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  categoryMeta,
  getProductType,
  onDelete
}) => {
  const handleDelete = () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    onDelete(product.id)
  }

  const productType = getProductType(product, categoryMeta)

  return (
    <tr className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:via-indigo-50/30 hover:to-purple-50/50 transition-all duration-300 group hover:shadow-md">
      {/* SKU */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="text-gray-700 font-semibold text-sm tracking-wide">{product.sku}</span>
        </div>
      </td>

      {/* Name */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-200">{product.name}</span>
        </div>
      </td>

      {/* Category */}
      <td className="py-5 px-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200/50 group-hover:shadow-sm transition-shadow duration-200">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          {product.category}
        </span>
      </td>

      {/* Stock */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${(product.stock ?? 0) > 50 ? 'bg-green-500' : (product.stock ?? 0) > 10 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className={`font-bold ${(product.stock ?? 0) > 50 ? 'text-green-700' : (product.stock ?? 0) > 10 ? 'text-yellow-700' : 'text-red-700'}`}>
            {product.stock ?? 0}
          </span>
        </div>
      </td>

      {/* Weight */}
      <td className="py-5 px-6">
        <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          {product.weight} g
        </span>
      </td>

      {/* Warehouse */}
      <td className="py-5 px-6">
        {product.primaryWarehouseName ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-shadow duration-200">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 9v12h20V9l-10-6zm0 2.18L19.09 9H4.91L12 5.18zM4 11h16v8H4v-8z" />
            </svg>
            {product.primaryWarehouseName}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">Chưa chọn</span>
        )}
      </td>

      {/* Product Type */}
      <td className="py-5 px-6">
        {productType === 'custom' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" />
            </svg>
            Tùy chỉnh
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Thường
          </span>
        )}
      </td>

      {/* Customizable */}
      <td className="py-5 px-6">
        {categoryMeta[product.category]?.isCustomizable ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Có
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Không
          </span>
        )}
      </td>

      {/* Price */}
      <td className="py-5 px-6">
        {product.price ? (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
            <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatVnd(product.price)} đ
            </span>
          </div>
        ) : (
          <span className="text-gray-500 italic text-sm">Liên hệ</span>
        )}
      </td>

      {/* Status */}
      <td className="py-5 px-6">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${product.status === 'active'
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
          }`}>
          {product.status === 'active' ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đang bán
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ngừng bán
            </>
          )}
        </span>
      </td>

      {/* Actions */}
      <td className="py-5 px-6">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={productType === 'custom'
              ? `/admin/products/edit-custom/${product.id}`
              : `/admin/products/edit-regular/${product.id}`
            }
            className={
              productType === 'custom'
                ? 'group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700'
                : 'group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
            }
          >
            <svg className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Sửa
          </Link>
          <button
            onClick={handleDelete}
            className="group/btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa
          </button>
        </div>
      </td>
    </tr>
  )
}

export default ProductTableRow