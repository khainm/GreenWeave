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
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
