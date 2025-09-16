# Cart Workflow Implementation

## Overview
The cart system now supports both anonymous and authenticated users with seamless transition when users log in.

## How It Works

### For Anonymous Users
1. User browses products and adds items to cart
2. A cart is created automatically and stored in localStorage with ID `gw_cart_id`
3. Users can add/remove/update items freely
4. At checkout, user must log in or register

### For Authenticated Users
1. **Case 1: User logs in with existing anonymous cart**
   - Anonymous cart gets assigned to the user
   - Cart persists across sessions
   
2. **Case 2: User logs in without anonymous cart**
   - System checks if user has existing cart
   - Uses existing cart or creates new one
   
3. **Case 3: User already logged in**
   - Cart is tied to user account
   - Persists across devices/sessions

## Frontend Usage

```typescript
import { CartService, handleUserLogin, getOrCreateCartId } from '@/services/cartService'

// For anonymous users - add items to cart
const cartId = await getOrCreateCartId()
await CartService.addItem(cartId, {
  productId: 123,
  quantity: 2,
  unitPrice: 25.99,
  colorCode: '#FF0000'
})

// When user logs in - handle cart assignment
const userId = "user123" // from auth context
const finalCartId = await handleUserLogin(userId)
// Cart is now assigned to user and will persist
```

## Backend Endpoints

### Create Cart
```
POST /api/cart
Response: { success: true, data: Cart }
```

### Get Cart
```
GET /api/cart/{cartId}
Response: { success: true, data: Cart }
```

### Assign Cart to User
```
PUT /api/cart/{cartId}/assign-user
Body: { userId: "string" }
Response: { success: true, data: Cart }
```

### Get User's Cart
```
GET /api/cart/user/{userId}
Response: { success: true, data: Cart }
```

### Add Item to Cart
```
POST /api/cart/{cartId}/items
Body: { productId: number, quantity: number, unitPrice: number, colorCode?: string }
Response: { success: true, data: CartItem }
```

## Integration Points

1. **Authentication Flow**: Call `handleUserLogin(userId)` when user logs in
2. **Checkout Process**: Ensure user is authenticated before proceeding
3. **Cart Persistence**: User carts persist across sessions automatically
4. **Session Management**: Anonymous carts stored in localStorage, user carts in database

## Error Handling

- If cart not found: 404 response with appropriate message
- If user already has cart: Existing cart takes precedence
- Network errors: Frontend should retry or show appropriate error message