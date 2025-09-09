import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminProductsList from './pages/AdminProductsList'
import AdminAddProduct from './pages/AdminAddProduct'
import AdminEditProduct from './pages/AdminEditProduct.tsx'
import AdminCategories from './pages/AdminCategories'
import ProductDetail from './pages/ProductDetail'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductsList />} />
          <Route path="/admin/products/add" element={<AdminAddProduct />} />
          <Route path="/admin/products/edit/:id" element={<AdminEditProduct />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
