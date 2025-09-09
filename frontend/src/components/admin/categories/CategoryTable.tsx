import React from 'react'

export type CategoryRow = {
  id: number
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
  productCount?: number
  isCustomizable?: boolean
}

type Props = {
  items: CategoryRow[]
  onChangeOrder: (id: number, newOrder: number) => void
  onBlurSave: (id: number) => void
  onEdit: (row: CategoryRow) => void
  onDelete: (id: number) => void
}

const CategoryTable: React.FC<Props> = ({ items, onChangeOrder, onBlurSave, onEdit, onDelete }) => {
  return (
    <table className="w-full text-left">
      <thead className="bg-gray-50">
        <tr className="text-gray-600 text-sm font-medium">
          <th className="py-3 px-6">Thứ tự</th>
          <th className="py-3 px-6">Tên</th>
          <th className="py-3 px-6">Mã</th>
          <th className="py-3 px-6">Số SP</th>
          <th className="py-3 px-6">Mô tả</th>
          <th className="py-3 px-6">Tùy biến</th>
          <th className="py-3 px-6">Trạng thái</th>
          <th className="py-3 px-6 text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="py-3 px-6 text-gray-700 w-28">
              <input type="number" value={c.sortOrder} onChange={e => onChangeOrder(c.id, Number(e.target.value))} onBlur={() => onBlurSave(c.id)} className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg" />
            </td>
            <td className="py-3 px-6 font-semibold text-gray-900">{c.name}</td>
            <td className="py-3 px-6 text-gray-700">{c.code}</td>
            <td className="py-3 px-6 text-gray-700">{c.productCount ?? 0}</td>
            <td className="py-3 px-6 text-gray-600">{c.description}</td>
            <td className="py-3 px-6 text-gray-700">{(c.isCustomizable ?? false) ? 'Có' : 'Không'}</td>
            <td className="py-3 px-6">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{c.status === 'active' ? 'Đang dùng' : 'Ngừng dùng'}</span>
            </td>
            <td className="py-3 px-6 text-right space-x-2">
              <button onClick={() => onEdit(c)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Sửa</button>
              <button onClick={() => onDelete(c.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm">Xóa</button>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td className="py-8 text-center text-gray-500" colSpan={8}>Không có danh mục</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default CategoryTable


