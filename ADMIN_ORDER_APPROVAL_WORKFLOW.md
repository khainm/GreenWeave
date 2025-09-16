# Admin Order Approval Workflow Documentation

## Overview
Khi khách hàng bấm "Đặt hàng", đơn hàng sẽ được tạo với trạng thái `Pending` và cần admin/staff duyệt trước khi xử lý.

## Backend Implementation ✅

### Order Status Flow
```
Customer Places Order → Pending → Admin Approves → Confirmed → Processing → Shipping → Delivered
                                ↓ Admin Rejects
                              Cancelled
```

### Database Changes
- **Order Model**: Added `ApprovedBy` and `ApprovedAt` fields
- **Migration**: `AddOrderApprovalFields` migration created

### API Endpoints

#### 1. Get Pending Orders (Admin/Staff Only)
```http
GET /api/orders/pending
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "orderNumber": "ORD-20250915-001",
      "customerId": "user123",
      "customer": {...},
      "status": "pending",
      "total": 31112,
      "createdAt": "2025-09-15T10:30:00Z",
      ...
    }
  ]
}
```

#### 2. Approve Order (Admin/Staff Only)
```http
PUT /api/orders/{id}/approve
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "status": "confirmed",
    "approvedBy": "admin123",
    "approvedAt": "2025-09-15T11:00:00Z",
    "confirmedAt": "2025-09-15T11:00:00Z",
    ...
  },
  "message": "Duyệt đơn hàng thành công"
}
```

#### 3. Reject Order (Admin/Staff Only)
```http
PUT /api/orders/{id}/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Sản phẩm hết hàng"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "status": "cancelled",
    "approvedBy": "admin123",
    "approvedAt": "2025-09-15T11:00:00Z",
    "cancelledAt": "2025-09-15T11:00:00Z",
    "cancelReason": "Sản phẩm hết hàng",
    ...
  },
  "message": "Từ chối đơn hàng thành công"
}
```

## Frontend Implementation Needed

### 1. Customer Checkout Flow
- When customer clicks "Đặt hàng", order is created with status "pending"
- Show message: "Đơn hàng của bạn đang chờ xác nhận từ cửa hàng"
- Display order tracking with pending status

### 2. Admin Dashboard
Create admin interface with:

#### Pending Orders List
```typescript
// services/adminService.ts
export const AdminService = {
  async getPendingOrders(): Promise<Order[]> {
    return await apiClient.get<Order[]>('/api/orders/pending')
  },
  
  async approveOrder(orderId: number): Promise<Order> {
    return await apiClient.put<Order>(`/api/orders/${orderId}/approve`)
  },
  
  async rejectOrder(orderId: number, reason: string): Promise<Order> {
    return await apiClient.put<Order>(`/api/orders/${orderId}/reject`, { reason })
  }
}
```

#### Admin Component Example
```tsx
// components/admin/PendingOrders.tsx
const PendingOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  
  const handleApprove = async (orderId: number) => {
    try {
      await AdminService.approveOrder(orderId)
      // Refresh orders list
      loadPendingOrders()
      toast.success('Đã duyệt đơn hàng thành công')
    } catch (error) {
      toast.error('Lỗi khi duyệt đơn hàng')
    }
  }
  
  const handleReject = async (orderId: number, reason: string) => {
    try {
      await AdminService.rejectOrder(orderId, reason)
      // Refresh orders list
      loadPendingOrders()
      toast.success('Đã từ chối đơn hàng')
    } catch (error) {
      toast.error('Lỗi khi từ chối đơn hàng')
    }
  }
  
  return (
    <div className="pending-orders">
      <h2>Đơn hàng chờ duyệt</h2>
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-info">
            <h3>#{order.orderNumber}</h3>
            <p>Khách hàng: {order.customer.name}</p>
            <p>Tổng tiền: {order.total.toLocaleString()}đ</p>
            <p>Ngày đặt: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="order-actions">
            <button 
              onClick={() => handleApprove(order.id)}
              className="approve-btn"
            >
              Duyệt
            </button>
            <button 
              onClick={() => handleReject(order.id, "Lý do từ chối")}
              className="reject-btn"
            >
              Từ chối
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 3. Order Status Display
Update order status component to show Vietnamese status:
```typescript
const getOrderStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return 'Chờ xác nhận'
    case 'confirmed': return 'Đã xác nhận'
    case 'processing': return 'Đang xử lý'
    case 'shipping': return 'Đang giao hàng'
    case 'delivered': return 'Đã giao hàng'
    case 'cancelled': return 'Đã hủy'
    default: return status
  }
}
```

## User Experience Flow

1. **Customer Journey**:
   - Thêm sản phẩm vào giỏ hàng
   - Điền thông tin giao hàng
   - Bấm "Đặt hàng" → Đơn hàng tạo với status "Pending"
   - Nhận thông báo: "Đơn hàng đang chờ xác nhận"
   - Chờ admin duyệt

2. **Admin Journey**:
   - Đăng nhập admin panel
   - Xem danh sách đơn hàng chờ duyệt
   - Kiểm tra thông tin đơn hàng
   - Quyết định duyệt hoặc từ chối
   - Khách hàng nhận email thông báo

3. **Email Notifications** (TODO):
   - Email xác nhận đơn hàng khi admin duyệt
   - Email thông báo từ chối khi admin từ chối

## Security
- Chỉ admin/staff có quyền duyệt đơn hàng
- Ghi log ai duyệt/từ chối đơn hàng nào
- Kiểm tra quyền hạn qua JWT token

## Next Steps
1. Implement admin frontend components
2. Update checkout flow to show pending status
3. Add email notification methods
4. Add order tracking page for customers
5. Add admin statistics for pending orders