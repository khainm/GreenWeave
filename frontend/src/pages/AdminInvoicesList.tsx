import React, { useState, useEffect } from 'react'
import TopNav from '../components/admin/TopNav'
import InvoiceService from '../services/invoiceService'
import { formatVnd } from '../utils/format'
import { InvoiceStatusBadge } from '../components/Invoice/InvoiceComponents'
import type { InvoiceDto, InvoiceFilters } from '../types/invoice'

// Component con để hiển thị filters
const InvoiceFilters: React.FC<{
  filters: InvoiceFilters
  onFiltersChange: (filters: InvoiceFilters) => void
}> = ({ filters, onFiltersChange }) => {
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'generated', label: 'Đã tạo' },
    { value: 'sent', label: 'Đã gửi' },
    { value: 'error', label: 'Lỗi' }
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Tìm theo số hóa đơn, tên hoặc email khách hàng..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Date To */}
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => onFiltersChange({})}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  )
}

// Component bảng hóa đơn
const InvoiceTable: React.FC<{
  invoices: InvoiceDto[]
  loading: boolean
  onDownload: (invoice: InvoiceDto) => void
  onResend: (invoice: InvoiceDto) => void
  onViewDetail: (invoice: InvoiceDto) => void
}> = ({ invoices, loading, onDownload, onResend, onViewDetail }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-t-xl"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 border-t border-gray-200"></div>
          ))}
        </div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có hóa đơn nào</h3>
        <p className="text-gray-500">Chưa có hóa đơn nào được tạo.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hóa đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">#{invoice.invoiceNumber}</div>
                    {invoice.fileName && (
                      <div className="text-sm text-gray-500">{invoice.fileName}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">#{invoice.orderId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invoice.customerName}</div>
                    <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formatVnd(invoice.total)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InvoiceStatusBadge status={invoice.status} />
                  {invoice.sentAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Gửi: {new Date(invoice.sentAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetail(invoice)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Xem
                    </button>
                    
                    {InvoiceService.canDownloadInvoice(invoice) && (
                      <button
                        onClick={() => onDownload(invoice)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                        title="Tải xuống hóa đơn"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}
                    
                    {InvoiceService.canResendInvoice(invoice) && (
                      <button
                        onClick={() => onResend(invoice)}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                        title="Gửi lại email hóa đơn"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const AdminInvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null)

  // Load dữ liệu
  const loadInvoices = async () => {
    try {
      setLoading(true)
      const invoicesData = await InvoiceService.getAllInvoices()
      
      // Apply client-side filtering (in real app, this should be done server-side)
      let filteredInvoices = invoicesData
      
      if (filters.status) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === filters.status)
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.customerName.toLowerCase().includes(searchLower) ||
          invoice.customerEmail.toLowerCase().includes(searchLower)
        )
      }
      
      if (filters.dateFrom) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          new Date(invoice.createdAt) >= new Date(filters.dateFrom!)
        )
      }
      
      if (filters.dateTo) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          new Date(invoice.createdAt) <= new Date(filters.dateTo!)
        )
      }
      
      setInvoices(filteredInvoices)
    } catch (error) {
      console.error('Error loading invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [filters])

  const handleDownload = async (invoice: InvoiceDto) => {
    try {
      const downloadResponse = await InvoiceService.downloadInvoice(invoice.id)
      InvoiceService.triggerDownload(downloadResponse.fileName, downloadResponse.content)
    } catch (error: any) {
      console.error('Error downloading invoice:', error)
      alert(`❌ ${error.message || 'Không thể tải xuống hóa đơn'}`)
    }
  }

  const handleResend = async (invoice: InvoiceDto) => {
    try {
      await InvoiceService.resendInvoice(invoice.id)
      loadInvoices() // Reload để cập nhật trạng thái
      alert('✅ Email hóa đơn đã được gửi lại thành công!')
    } catch (error: any) {
      console.error('Error resending invoice:', error)
      alert(`❌ ${error.message || 'Không thể gửi lại email hóa đơn'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="mt-2 text-gray-600">Theo dõi và quản lý tất cả hóa đơn trong hệ thống</p>
        </div>

        {/* Filters */}
        <InvoiceFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Bảng hóa đơn */}
        <InvoiceTable 
          invoices={invoices}
          loading={loading}
          onDownload={handleDownload}
          onResend={handleResend}
          onViewDetail={setSelectedInvoice}
        />
      </div>

      {/* Modal chi tiết hóa đơn */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chi tiết hóa đơn #{selectedInvoice.invoiceNumber}</h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin hóa đơn</h4>
                    <p className="text-sm text-gray-600">Số HĐ: {selectedInvoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">Đơn hàng: #{selectedInvoice.orderId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">Trạng thái:</span>
                      <InvoiceStatusBadge status={selectedInvoice.status} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin khách hàng</h4>
                    <p className="text-sm text-gray-600">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.customerEmail}</p>
                    {selectedInvoice.customerPhone && (
                      <p className="text-sm text-gray-600">{selectedInvoice.customerPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Chi tiết thanh toán</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tạm tính:</span>
                      <span className="text-sm font-medium">{formatVnd(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Phí vận chuyển:</span>
                      <span className="text-sm font-medium">{formatVnd(selectedInvoice.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Giảm giá:</span>
                      <span className="text-sm font-medium">-{formatVnd(selectedInvoice.discount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-gray-900">Tổng cộng:</span>
                      <span className="text-lg font-bold text-green-600">{formatVnd(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin thời gian</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Ngày tạo: {new Date(selectedInvoice.createdAt).toLocaleString('vi-VN')}</p>
                    <p>Cập nhật: {new Date(selectedInvoice.updatedAt).toLocaleString('vi-VN')}</p>
                    {selectedInvoice.sentAt && (
                      <p>Ngày gửi: {new Date(selectedInvoice.sentAt).toLocaleString('vi-VN')}</p>
                    )}
                  </div>
                </div>

                {selectedInvoice.errorMessage && (
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Lỗi</h4>
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                      {selectedInvoice.errorMessage}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  {InvoiceService.canDownloadInvoice(selectedInvoice) && (
                    <button
                      onClick={() => handleDownload(selectedInvoice)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Tải xuống PDF
                    </button>
                  )}
                  
                  {InvoiceService.canResendInvoice(selectedInvoice) && (
                    <button
                      onClick={() => handleResend(selectedInvoice)}
                      className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                    >
                      Gửi lại email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInvoicesList