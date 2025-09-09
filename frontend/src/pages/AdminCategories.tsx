import React, { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/admin/TopNav'
import CategoryService from '../services/categoryService'
import type { CreateCategoryRequest } from '../types/category'

type Category = {
  id: number
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        setLoading(true)
        const apiItems = await CategoryService.list()
        const mapped: Category[] = apiItems.map(i => ({
          id: i.id,
          name: i.name,
          code: i.code,
          description: i.description,
          status: i.status,
          sortOrder: i.sortOrder
        }))
        setCategories(mapped)
      } catch (e) {
        setError('Không thể tải danh mục')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return categories
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [categories, query])

  const onSave = async (cat: Omit<Category, 'id'>, id?: number) => {
    if (id) {
      const payload: CreateCategoryRequest = { ...cat }
      const updated = await CategoryService.update(id, payload)
      setCategories(prev => prev.map(c => c.id === id ? { id, name: updated.name, code: updated.code, description: updated.description, status: updated.status, sortOrder: updated.sortOrder } : c))
    } else {
      const payload: CreateCategoryRequest = { ...cat }
      const created = await CategoryService.create(payload)
      setCategories(prev => [...prev, { id: created.id, name: created.name, code: created.code, description: created.description, status: created.status, sortOrder: created.sortOrder }])
    }
    setModalOpen(false)
    setEditing(null)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return
    await CategoryService.remove(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Danh mục sản phẩm</h1>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Thêm danh mục</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc mã" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-gray-500">Đang tải...</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600 text-sm font-medium">
                    <th className="py-3 px-6">Thứ tự</th>
                    <th className="py-3 px-6">Tên</th>
                    <th className="py-3 px-6">Mã</th>
                    <th className="py-3 px-6">Số SP</th>
                    <th className="py-3 px-6">Mô tả</th>
                    <th className="py-3 px-6">Trạng thái</th>
                    <th className="py-3 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-6 text-gray-700 w-28">
                        <input type="number" value={c.sortOrder} onChange={e => setCategories(prev => prev.map(x => x.id === c.id ? { ...x, sortOrder: Number(e.target.value) } : x))} onBlur={async () => {
                          const target = categories.find(x => x.id === c.id)
                          if (!target) return
                          await CategoryService.update(c.id, { name: target.name, code: target.code, description: target.description, status: target.status, sortOrder: target.sortOrder })
                        }} className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg" />
                      </td>
                      <td className="py-3 px-6 font-semibold text-gray-900">{c.name}</td>
                      <td className="py-3 px-6 text-gray-700">{c.code}</td>
                      <td className="py-3 px-6 text-gray-700">{(c as any).productCount ?? '-'}</td>
                      <td className="py-3 px-6 text-gray-600">{c.description}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{c.status === 'active' ? 'Đang dùng' : 'Ngừng dùng'}</span>
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button onClick={() => { setEditing(c); setModalOpen(true) }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Sửa</button>
                        <button onClick={() => onDelete(c.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm">Xóa</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="py-8 text-center text-gray-500" colSpan={6}>Không có danh mục</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {modalOpen && (
          <CategoryModal
            initial={editing || { name: '', code: '', description: '', status: 'active', sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 1 }}
            existingCodes={categories.map(c => c.code)}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            onSave={(cat) => onSave(cat, editing?.id)}
          />
        )}
      </div>
    </div>
  )
}

const removeAccents = (str: string): string => str.normalize('NFD').replace(/\p{Diacritic}/gu, '')
const generateCategoryCode = (name: string, taken: string[], maxLen = 4): string => {
  const cleaned = removeAccents(name).replace(/[^a-zA-Z0-9\s-]+/g, ' ').trim()
  const words = cleaned.split(/\s+|-/).filter(Boolean)
  let base = ''
  if (words.length >= 2) {
    base = words.map(w => w[0]).join('').toUpperCase()
  }
  if (!base) {
    base = cleaned.replace(/\s+/g, '').slice(0, maxLen).toUpperCase()
  }
  if (!base) base = 'CAT'
  let code = base
  let i = 1
  while (taken.includes(code)) {
    i += 1
    code = `${base}${i}`
  }
  return code
}

const CategoryModal: React.FC<{ initial: Omit<Category, 'id'>, existingCodes: string[], onClose: () => void, onSave: (c: Omit<Category, 'id'>) => void }> = ({ initial, existingCodes, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<Category, 'id'>>({
    ...initial,
    code: initial.code || ''
  })
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

export default AdminCategories


