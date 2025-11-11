// 📞 Admin Consultation Requests Management Page
// View and manage customer consultation requests

import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import TopNav from '../../components/admin/TopNav';

interface ConsultationRequest {
  id: string;
  productId?: string;
  productName?: string;
  customerName: string;
  phone?: string;
  zalo?: string;
  facebook?: string;
  email?: string;
  preferredContact: 'phone' | 'zalo' | 'facebook';
  notes?: string;
  designPreview?: string;
  status: string;
  priorityLevel?: string;
  requestedAt: string;
  estimatedPrice?: number;
}

interface PaginatedResult {
  items: ConsultationRequest[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const AdminConsultationPage: React.FC = () => {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch consultation requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token'); // ✅ Sửa key đúng
      
      if (!token) {
        alert('Vui lòng đăng nhập để xem trang này');
        window.location.href = '/login';
        return;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20'
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/consultationrequests/admin/list?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch consultation requests');

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch consultation requests');
      }
      
      const data: PaginatedResult = result.data;
      
      setRequests(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching consultation requests:', error);
      alert('Không thể tải danh sách yêu cầu tư vấn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Update status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token'); // ✅ Sửa key đúng
      
      const response = await fetch(
        `${API_BASE_URL}/api/consultationrequests/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            adminNotes: `Status updated to ${newStatus}`
          })
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      alert('Cập nhật trạng thái thành công!');
      fetchRequests();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Không thể cập nhật trạng thái');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      quoted: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'phone': return <PhoneIcon className="w-5 h-5" />;
      case 'zalo': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'facebook': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default: return <EnvelopeIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📞 Yêu cầu tư vấn</h1>
          <p className="text-gray-600">Quản lý và xử lý yêu cầu tư vấn từ khách hàng</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="contacted">Đã liên hệ</option>
              <option value="quoted">Đã báo giá</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">Chưa có yêu cầu tư vấn nào</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{request.customerName}</div>
                        {request.email && (
                          <div className="text-sm text-gray-500">{request.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{request.productName || 'N/A'}</div>
                        {request.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {request.notes.substring(0, 50)}{request.notes.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {request.designPreview ? (
                          <img 
                            src={request.designPreview} 
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23ddd"/><text x="50%" y="50%" font-size="12" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getContactIcon(request.preferredContact)}
                          <span className="text-sm text-gray-900">
                            {request.preferredContact === 'phone' && request.phone}
                            {request.preferredContact === 'zalo' && request.zalo}
                            {request.preferredContact === 'facebook' && request.facebook}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                        >
                          <EyeIcon className="w-5 h-5" />
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết yêu cầu tư vấn</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Tên khách hàng</label>
                    <p className="font-medium">{selectedRequest.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedRequest.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Điện thoại</label>
                    <p className="font-medium">{selectedRequest.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Zalo</label>
                    <p className="font-medium">{selectedRequest.zalo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Facebook</label>
                    <p className="font-medium">{selectedRequest.facebook || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Liên hệ ưu tiên</label>
                    <p className="font-medium capitalize">{selectedRequest.preferredContact}</p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sản phẩm</h3>
                <p className="font-medium text-lg">{selectedRequest.productName || 'N/A'}</p>
                
                {selectedRequest.designPreview ? (
                  <div className="mt-4">
                    <label className="text-sm text-gray-500 block mb-2">Ảnh sản phẩm khách hàng thiết kế</label>
                    <img 
                      src={selectedRequest.designPreview} 
                      alt="Product preview"
                      className="max-w-full md:max-w-md rounded-lg shadow-md border border-gray-200"
                      onError={(e) => {
                        console.error('Failed to load image:', selectedRequest.designPreview);
                        (e.target as HTMLImageElement).style.display = 'none';
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'text-red-500 text-sm mt-2';
                        errorMsg.textContent = '⚠️ Không thể tải ảnh sản phẩm';
                        e.currentTarget.parentElement?.appendChild(errorMsg);
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">📷 Khách hàng chưa upload ảnh sản phẩm</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ghi chú</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Status Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cập nhật trạng thái</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Đã liên hệ
                  </button>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'quoted')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Đã báo giá
                  </button>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Hoàn thành
                  </button>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'cancelled')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsultationPage;
