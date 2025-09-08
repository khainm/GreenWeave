# API Documentation - Products

## Endpoints

### 1. Lấy danh sách sản phẩm
```
GET /api/products
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Túi Tote Non-stop Single",
      "sku": "NON1234",
      "category": "Non-stop",
      "description": "Mô tả sản phẩm...",
      "price": 159000,
      "originalPrice": 199000,
      "stock": 120,
      "status": "active",
      "createdAt": "2025-09-08T10:00:00Z",
      "updatedAt": "2025-09-08T10:00:00Z",
      "images": [
        {
          "id": 1,
          "imageUrl": "https://res.cloudinary.com/...",
          "sortOrder": 0,
          "isPrimary": true
        }
      ],
      "colors": [
        {
          "id": 1,
          "colorCode": "#10b981",
          "colorName": "Xanh lá",
          "sortOrder": 0
        }
      ]
    }
  ]
}
```

### 2. Lấy sản phẩm theo ID
```
GET /api/products/{id}
```

### 3. Lấy sản phẩm theo SKU
```
GET /api/products/sku/{sku}
```

### 4. Tạo sản phẩm mới
```
POST /api/products
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, required): Tên sản phẩm
- `sku` (string, required): Mã SKU
- `category` (string, required): Danh mục
- `description` (string, optional): Mô tả
- `price` (decimal, required): Giá bán
- `originalPrice` (decimal, optional): Giá gốc
- `stock` (int, required): Tồn kho
- `status` (string, required): Trạng thái (active/inactive)
- `colors` (string[], optional): Mảng mã màu hex
- `imageUrls` (string[], optional): Mảng URL hình ảnh
- `imageFiles` (file[], optional): Files hình ảnh upload

**Example với cURL:**
```bash
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Túi Tote Mới" \
  -F "sku=NON1234" \
  -F "category=Non-stop" \
  -F "description=Mô tả sản phẩm mới" \
  -F "price=159000" \
  -F "originalPrice=199000" \
  -F "stock=100" \
  -F "status=active" \
  -F "colors=#10b981" \
  -F "colors=#ffffff" \
  -F "imageFiles=@image1.jpg" \
  -F "imageFiles=@image2.jpg"
```

### 5. Cập nhật sản phẩm
```
PUT /api/products/{id}
Content-Type: multipart/form-data
```

### 6. Xóa sản phẩm
```
DELETE /api/products/{id}
```

### 7. Tạo SKU tự động
```
POST /api/products/generate-sku
Content-Type: application/json

{
  "category": "Non-stop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sku": "NON1234"
  }
}
```

## Setup Cloudinary

1. Đăng ký tài khoản tại https://cloudinary.com
2. Lấy thông tin Cloud Name, API Key, API Secret từ Dashboard
3. Cập nhật trong `appsettings.json`:

```json
{
  "Cloudinary": {
    "CloudName": "your_cloud_name",
    "ApiKey": "your_api_key", 
    "ApiSecret": "your_api_secret"
  }
}
```

## Database Migration

```bash
# Tạo và chạy migration
dotnet ef migrations add AddProductTables
dotnet ef database update
```

## Cách sử dụng từ Frontend

```typescript
// Tạo sản phẩm mới với file upload
const createProduct = async (productData: any, imageFiles: File[]) => {
  const formData = new FormData();
  
  // Thêm thông tin sản phẩm
  Object.keys(productData).forEach(key => {
    if (Array.isArray(productData[key])) {
      productData[key].forEach((item: any) => {
        formData.append(key, item);
      });
    } else {
      formData.append(key, productData[key]);
    }
  });
  
  // Thêm files
  imageFiles.forEach(file => {
    formData.append('imageFiles', file);
  });
  
  const response = await fetch('/api/products', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```
