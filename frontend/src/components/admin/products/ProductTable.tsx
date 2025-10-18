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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-gray-600 text-sm font-medium">
              {tableHeaders.map((column) => (
                <th 
                  key={column.key} 
                  className="py-4 px-6 cursor-pointer select-none hover:bg-gray-100 transition-colors" 
                  onClick={() => onSort(column.key as SortableProductKey)}
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {(sortKey === (column.key as SortableProductKey)) && (
                      <svg className="ml-2" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z" transform={sortDir === 'asc' ? 'rotate(180 12 12)' : ''} />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-4 px-6">Trạng thái</th>
              <th className="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500">Đang tải danh sách sản phẩm...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  Không tìm thấy sản phẩm nào
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