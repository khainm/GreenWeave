import React, { useState } from 'react'

export type CategoryForm = {
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  isCustomizable: boolean
  sortOrder: number
}

export const removeAccents = (str: string): string => str.normalize('NFD').replace(/\p{Diacritic}/gu, '')
export const generateCategoryCode = (name: string, taken: string[], maxLen = 4): string => {
  const cleaned = removeAccents(name).replace(/[^a-zA-Z0-9\s-]+/g, ' ').trim()
  const words = cleaned.split(/\s+|-/).filter(Boolean)
  let base = ''
  if (words.length >= 2) base = words.map(w => w[0]).join('').toUpperCase()
  if (!base) base = cleaned.replace(/\s+/g, '').slice(0, maxLen).toUpperCase()
  if (!base) base = 'CAT'
  let code = base
  let i = 1
  while (taken.includes(code)) { i += 1; code = `${base}${i}` }
  return code
}

type Props = {
  initial: CategoryForm
  existingCodes: string[]
  onClose: () => void
  onSave: (form: CategoryForm) => void
}

const CategoryModal: React.FC<Props> = ({ initial, existingCodes, onClose, onSave }) => {
  const [form, setForm] = useState<CategoryForm>({ ...initial, code: initial.code || '' })
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{initial.name ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên *</label>
            <input
              value={form.name}
              onChange={e => {
                const name = e.target.value
                const auto = generateCategoryCode(name, existingCodes.filter(c => c !== initial.code))
                setForm(prev => ({ ...prev, name, code: auto }))
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã *</label>
            <input value={form.code} readOnly className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-700 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 mb-2">
              <input 
                type="checkbox" 
                checked={form.isCustomizable} 
                onChange={e => setForm(prev => ({ ...prev, isCustomizable: e.target.checked }))} 
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2" 
              />
              Cho phép tuỳ chỉnh sản phẩm
            </label>
            <p className="text-xs text-gray-500">Các sản phẩm trong danh mục này có thể được tuỳ chỉnh thiết kế</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="active">Đang dùng</option>
              <option value="inactive">Ngừng dùng</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-xl">Hủy</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">Lưu</button>
        </div>
      </div>
    </div>
  )
}

export default CategoryModal


