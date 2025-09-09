import React, { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/admin/TopNav'
import CategoryService from '../services/categoryService'
import type { CreateCategoryRequest, Category as ApiCategory } from '../types/category'
import CategoryTable, { type CategoryRow } from '../components/admin/categories/CategoryTable'
import CategoryModalComponent, { type CategoryForm } from '../components/admin/categories/CategoryModal'

type Category = ApiCategory

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
        setCategories(apiItems)
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

  const onSave = async (cat: CategoryForm, id?: number) => {
    const isVisible = cat.status === 'active'
    if (id) {
      const payload: CreateCategoryRequest = { name: cat.name, code: cat.code, description: cat.description, status: cat.status, sortOrder: cat.sortOrder, isVisible, isCustomizable: cat.isCustomizable }
      const updated = await CategoryService.update(id, payload)
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
    } else {
      const payload: CreateCategoryRequest = { name: cat.name, code: cat.code, description: cat.description, status: cat.status, sortOrder: cat.sortOrder, isVisible, isCustomizable: cat.isCustomizable }
      const created = await CategoryService.create(payload)
      setCategories(prev => [...prev, created])
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
              <CategoryTable
                items={filtered as unknown as CategoryRow[]}
                onChangeOrder={(id, newOrder) => setCategories(prev => prev.map(x => x.id === id ? { ...x, sortOrder: newOrder } : x))}
                onBlurSave={async (id) => {
                  const target = categories.find(x => x.id === id)
                  if (!target) return
                  const isVisible = target.status === 'active'
                  await CategoryService.update(id, { name: target.name, code: target.code, description: target.description, status: target.status, sortOrder: target.sortOrder, isVisible, isCustomizable: target.isCustomizable })
                }}
                onEdit={(row) => { setEditing(row as unknown as Category); setModalOpen(true) }}
                onDelete={(id) => onDelete(id)}
              />
            )}
          </div>
        </div>

        {modalOpen && (
          <CategoryModalComponent
            initial={editing || { name: '', code: '', description: '', status: 'active', sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 1, isCustomizable: false }}
            existingCodes={categories.map(c => c.code)}
            onClose={() => { setModalOpen(false); setEditing(null) }}
            onSave={(cat) => onSave(cat, editing?.id)}
          />
        )}
      </div>
    </div>
  )
}

export default AdminCategories


