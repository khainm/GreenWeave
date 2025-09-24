import React, { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { WebhookService, type WebhookEvent, type WebhookStats } from '../../services/webhookService'

// Use imported types from WebhookService

const ViettelPostWebhookStatus: React.FC = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadWebhookData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadWebhookData, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadWebhookData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load recent webhook logs
      const events = await WebhookService.getRecentWebhookLogs(50)
      setWebhookEvents(events)
      
      // Load stats
      const webhookStats = await WebhookService.getWebhookStats()
      setStats(webhookStats)
      
    } catch (err) {
      setError('Không thể tải dữ liệu webhook')
      console.error('Error loading webhook data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: number, isSuccess: boolean) => {
    if (!isSuccess) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />
    }
    
    switch (status) {
      case 501:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 508:
      case 200:
        return <ClockIcon className="w-5 h-5 text-blue-500" />
      case 507:
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: number, isSuccess: boolean) => {
    if (!isSuccess) {
      return 'text-red-600 bg-red-100'
    }
    
    switch (status) {
      case 501:
        return 'text-green-600 bg-green-100'
      case 508:
      case 200:
        return 'text-blue-600 bg-blue-100'
      case 507:
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải dữ liệu webhook...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadWebhookData}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Webhook ViettelPost
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Theo dõi trạng thái webhook từ ViettelPost
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadWebhookData}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <ArrowPathIcon className="w-4 h-4 inline mr-1" />
              Làm mới
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded ${
                autoRefresh 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {autoRefresh ? 'Tắt tự động' : 'Bật tự động'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Tổng webhook</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWebhooks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Thành công</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulWebhooks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Thất bại</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedWebhooks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cập nhật cuối</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.lastWebhookTime ? formatTimestamp(stats.lastWebhookTime) : 'Chưa có'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">
            Lịch sử Webhook ({webhookEvents.length})
          </h4>
        </div>

        <div className="divide-y divide-gray-200">
          {webhookEvents.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Chưa có dữ liệu webhook</p>
              <p className="text-sm text-gray-500">Webhook sẽ xuất hiện khi có cập nhật từ ViettelPost</p>
            </div>
          ) : (
            webhookEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(event.orderStatus, event.isSuccess)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {event.orderNumber}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.orderStatus, event.isSuccess)}`}>
                          {event.statusDescription}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Thời gian:</span>
                          <p>{formatTimestamp(event.createdAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Dịch vụ:</span>
                          <p>{event.orderService}</p>
                        </div>
                        <div>
                          <span className="font-medium">Trọng lượng:</span>
                          <p>{event.productWeight}g</p>
                        </div>
                      </div>

                      {event.note && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-600">Ghi chú:</span>
                          <p className="text-sm text-gray-600">{event.note}</p>
                        </div>
                      )}

                      {event.errorMessage && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-red-600">Lỗi:</span>
                          <p className="text-sm text-red-600">{event.errorMessage}</p>
                        </div>
                      )}

                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>💰 {formatCurrency(event.moneyTotal)}</span>
                        <span>⚖️ {event.productWeight}g</span>
                        <span>📦 {event.orderService}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ViettelPostWebhookStatus
