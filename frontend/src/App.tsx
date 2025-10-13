import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
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
import AdminWarehousePage from './pages/admin/AdminWarehousePage'
import AdminWarehouseStockPage from './pages/admin/AdminWarehouseStockPage'
import AdminCreateOrderPage from './pages/admin/AdminCreateOrderPage'
import AdminCreateCustomOrderPage from './pages/admin/AdminCreateCustomOrderPage'
import ViettelPostIntegration from './components/admin/ViettelPostIntegration'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import AdminBlogPage from './pages/admin/AdminBlogPage'
import AdminBlogFormPage from './pages/admin/AdminBlogFormPage'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import MyOrdersPage from './pages/MyOrdersPage'
import PaymentPage from './pages/PaymentPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import AddressPage from './pages/AddressPage'
import PaymentResultPage from './pages/PaymentResultPage';
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/custom" element={<CustomProductDesigner />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <MyOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <OrderDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/:orderId" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/addresses" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
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
            <Route path="/admin/orders/create" element={
              <ProtectedRoute requireStaff={true}>
                <AdminCreateOrderPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders/create-custom" element={
              <ProtectedRoute requireStaff={true}>
                <AdminCreateCustomOrderPage />
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
            <Route path="/admin/warehouses" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminWarehousePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/warehouse-stock" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminWarehouseStockPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/viettelpost" element={
              <ProtectedRoute requireAdmin={true}>
                <ViettelPostIntegration />
              </ProtectedRoute>
            } />
            <Route path="/admin/blog" element={
              <ProtectedRoute requireStaff={true}>
                <AdminBlogPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/blog/create" element={
              <ProtectedRoute requireStaff={true}>
                <AdminBlogFormPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/blog/edit/:id" element={
              <ProtectedRoute requireStaff={true}>
                <AdminBlogFormPage />
              </ProtectedRoute>
            } />
            <Route path="/payment-result" element={<PaymentResultPage />} />
          </Routes>
          </div>
        </Router>
      </AuthProvider>
  )
}

export default App
