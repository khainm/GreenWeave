import React from 'react'
import type { Product } from '../../../types/product'
import ProductTableRow from './ProductTableRow'

// Extended type for sorting that includes productType
type SortableProductKey = keyof Product | 'productType'

interface ProductTableProps {
  products: Product[]
  isLoading: boolean
  categoryMeta: Record<string, { isCustomizable: boolean }>
  getProductType: (product: Product, categoryMeta: Record<string, { isCustomizable: boolean }>) => 'regular' | 'custom'
  sortKey: SortableProductKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortableProductKey) => void
  onDeleteProduct: (id: number) => void
  onEditCustomProduct?: (product: Product) => void
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  categoryMeta,
  getProductType,
  sortKey,
  sortDir,
  onSort,
  onDeleteProduct,
  onEditCustomProduct
}) => {
  const tableHeaders = [
    { key: 'sku', label: 'Mã' },
    { key: 'name', label: 'Tên hàng hóa' },
    { key: 'category', label: 'Danh mục' },
    { key: 'stock', label: 'Tồn kho' },
    { key: 'weight', label: 'Khối lượng (g)' },
    { key: 'primaryWarehouseName', label: 'Kho chính' },
    { key: 'productType', label: 'Loại sản phẩm' },
    { key: 'isCustomizable', label: 'Tuỳ chỉnh' },
    { key: 'price', label: 'Giá bán' },
  ] as const

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-purple-100 overflow-hidden ring-1 ring-purple-200/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 sticky top-0 z-10">
            <tr className="text-white text-sm font-semibold">
              {tableHeaders.map((column) => (
                <th 
                  key={column.key} 
                  className="py-5 px-6 cursor-pointer select-none hover:bg-white/10 transition-all duration-200 backdrop-blur-sm group" 
                  onClick={() => onSort(column.key as SortableProductKey)}
                >
                  <div className="flex items-center gap-2">
                    <span className="group-hover:scale-105 transition-transform duration-200">{column.label}</span>
                    {(sortKey === (column.key as SortableProductKey)) ? (
                      <svg 
                        className="w-4 h-4 transition-all duration-300 ease-out" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity duration-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-5 px-6">Trạng thái</th>
              <th className="py-5 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100/50 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 font-medium">Đang tải danh sách sản phẩm...</p>
                      <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-700 font-semibold text-lg">Không tìm thấy sản phẩm nào</p>
                      <p className="text-sm text-gray-500">Thử điều chỉnh bộ lọc hoặc thêm sản phẩm mới</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  categoryMeta={categoryMeta}
                  getProductType={getProductType}
                  onDelete={onDeleteProduct}
                  onEditCustom={onEditCustomProduct}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductTable