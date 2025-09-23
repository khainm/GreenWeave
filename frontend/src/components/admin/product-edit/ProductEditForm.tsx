import React from 'react'
import { Link } from 'react-router-dom'
import ProductForm, { type ProductFormValues } from '../ProductForm'

interface ProductEditFormProps {
  form: ProductFormValues
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>
  isSaving: boolean
  error: string | null
  categoryOptions: { label: string; value: string; isCustomizable: boolean }[]
  warehouseOptions: { label: string; value: string }[]
  onSubmit: (e: React.FormEvent) => Promise<void>
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({
  form,
  setForm,
  isSaving,
  error,
  categoryOptions,
  warehouseOptions,
  onSubmit
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin sản phẩm</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <ProductForm
        values={form}
        setValues={setForm}
        isSubmitting={isSaving}
        onSubmit={onSubmit}
        categoryOptions={categoryOptions}
        categoryIsCustomizable={categoryOptions.find(o => o.label === form.category)?.isCustomizable}
        warehouseOptions={warehouseOptions}
      />
      
      <div className="mt-4">
        <Link 
          to="/admin/products" 
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Hủy
        </Link>
      </div>
    </div>
  )
}

export default ProductEditForm