import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import CustomProductDesigner from './pages/CustomProductDesigner.tsx'
import ProductsPage from './pages/ProductsPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminProductsList from './pages/AdminProductsList'
import AdminAddProduct from './pages/AdminAddProduct'
import AdminEditProduct from './pages/AdminEditProduct.tsx'
import AdminCategories from './pages/AdminCategories'
import AdminOrdersList from './pages/AdminOrdersList'
import AdminOrderDetail from './pages/AdminOrderDetail'
import CustomerList from './pages/admin/CustomerList'
import CustomerDetail from './pages/admin/CustomerDetail'
import StaffList from './pages/admin/StaffList'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import MyOrdersPage from './pages/MyOrdersPage'
import PaymentPage from './pages/PaymentPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AddressPage from './pages/AddressPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/custom" element={<CustomProductDesigner />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={
              <ProtectedRoute requireAuth={true}>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute requireAuth={true}>
                <MyOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute requireAuth={true}>
                <OrderDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/:orderId" element={
              <ProtectedRoute requireAuth={true}>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={
              <ProtectedRoute requireAuth={true}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/addresses" element={
              <ProtectedRoute requireAuth={true}>
                <AddressPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute requireStaff={true}>
                <AdminProductsList />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/add" element={
              <ProtectedRoute requireStaff={true}>
                <AdminAddProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/edit/:id" element={
              <ProtectedRoute requireStaff={true}>
                <AdminEditProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute requireStaff={true}>
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute requireStaff={true}>
                <AdminOrdersList />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <ProtectedRoute requireStaff={true}>
                <AdminOrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute requireStaff={true}>
                <CustomerList />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:customerCode" element={
              <ProtectedRoute requireStaff={true}>
                <CustomerDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute requireAdmin={true}>
                <StaffList />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute requireStaff={true}>
                <CustomerList />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers/:customerCode" element={
              <ProtectedRoute requireStaff={true}>
                <CustomerDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
