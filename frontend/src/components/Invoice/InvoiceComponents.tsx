import React from 'react'
import type { InvoiceStatus } from '../../types/invoice'
import { InvoiceService } from '../../services/invoiceService'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const statusInfo = InvoiceService.getStatusInfo(status)
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${className}`}
    >
      {statusInfo.label}
    </span>
  )
}

interface InvoiceInfoCardProps {
  orderId: number
  hasInvoice?: boolean
  invoiceNumber?: string
  invoiceStatus?: InvoiceStatus
  onGenerateInvoice?: (orderId: number) => void
  onDownloadInvoice?: (orderId: number) => void
  onResendInvoice?: (orderId: number) => void
  className?: string
}

export const InvoiceInfoCard: React.FC<InvoiceInfoCardProps> = ({
  orderId,
  hasInvoice,
  invoiceNumber,
  invoiceStatus,
  onGenerateInvoice,
  onDownloadInvoice,
  onResendInvoice,
  className = ''
}) => {
  if (!hasInvoice) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Hóa đơn</h3>
            <p className="text-sm text-gray-500">Chưa có hóa đơn</p>
          </div>
          {onGenerateInvoice && (
            <button
              onClick={() => onGenerateInvoice(orderId)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tạo hóa đơn
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">Hóa đơn</h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600">Số HĐ: {invoiceNumber}</p>
            {invoiceStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Trạng thái:</span>
                <InvoiceStatusBadge status={invoiceStatus} />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {onDownloadInvoice && invoiceStatus && ['generated', 'sent'].includes(invoiceStatus) && (
            <button
              onClick={() => onDownloadInvoice(orderId)}
              className="p-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
              title="Tải xuống hóa đơn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          
          {onResendInvoice && invoiceStatus && ['generated', 'error'].includes(invoiceStatus) && (
            <button
              onClick={() => onResendInvoice(orderId)}
              className="p-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
              title="Gửi lại email hóa đơn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default { InvoiceStatusBadge, InvoiceInfoCard }