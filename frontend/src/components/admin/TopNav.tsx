import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan' },
  { label: 'Hàng hóa' },
  { label: 'Đơn hàng' },
  { label: 'Khách hàng' },
  { label: 'Nhân Viên' },
  { label: 'Blog' },
  { label: 'Báo cáo', badge: 'Mới' },
  { label: 'Bán online' }
]



const TopNav: React.FC = () => {
  const location = useLocation()
  const [isGoodsOpen, setIsGoodsOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isCustomersOpen, setIsCustomersOpen] = useState(false)
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  const goodsRef = useRef<HTMLDivElement | null>(null)
  const ordersRef = useRef<HTMLDivElement | null>(null)
  const customersRef = useRef<HTMLDivElement | null>(null)
  const staffRef = useRef<HTMLDivElement | null>(null)
  const goodsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ordersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const customersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const staffTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (goodsRef.current && !goodsRef.current.contains(e.target as Node)) {
        setIsGoodsOpen(false)
      }
      if (ordersRef.current && !ordersRef.current.contains(e.target as Node)) {
        setIsOrdersOpen(false)
      }
      if (customersRef.current && !customersRef.current.contains(e.target as Node)) {
        setIsCustomersOpen(false)
      }
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setIsStaffOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      // Cleanup timeouts
      if (goodsTimeoutRef.current) clearTimeout(goodsTimeoutRef.current)
      if (ordersTimeoutRef.current) clearTimeout(ordersTimeoutRef.current)
      if (customersTimeoutRef.current) clearTimeout(customersTimeoutRef.current)
      if (staffTimeoutRef.current) clearTimeout(staffTimeoutRef.current)
    }
  }, [])

  return (
    <div className="w-full">
      {/* Top white bar */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <span className="text-lg">GW</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-wide">
              GreenWeave
            </div>
          </div>
          <div className="flex items-center space-x-6 text-gray-700">
            {/* Giao hàng */}
            <div className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M4 15a1 1 0 001 1h1l1 4h10l1-4h1a1 1 0 001-1v-4H4v4zm0-6h16l-2-5H6L4 9z"/>
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
              </div>
              <span className="text-sm font-semibold">Giao hàng</span>
            </div>

            {/* Separator dot */}
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>

            {/* Chủ đề */}
            <div className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-sm font-semibold">Chủ đề</span>
            </div>

            {/* Hỗ trợ */}
            <div className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span className="text-sm font-semibold">Hỗ trợ</span>
            </div>

            {/* Góp ý */}
            <div className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span className="text-sm font-semibold">Góp ý</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-2 cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 bg-red-500 rounded-sm flex items-center justify-center shadow-sm">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
                <span className="text-sm font-semibold">Tiếng Việt</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">3</span>
            </div>

            {/* Settings */}
            <div className="cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>

            {/* User Profile */}
            <div className="cursor-pointer hover:text-green-600 transition-all duration-300 hover:bg-green-50 px-3 py-2 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Green tabs bar */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white relative shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {tabs.map((t) => {
              const isActive = (t.label === 'Tổng quan' && location.pathname === '/admin') ||
                               (t.label === 'Hàng hóa' && location.pathname.startsWith('/admin/products')) ||
                               (t.label === 'Đơn hàng' && location.pathname.startsWith('/admin/orders')) ||
                               (t.label === 'Khách hàng' && location.pathname.startsWith('/admin/customers')) ||
                               (t.label === 'Nhân Viên' && location.pathname.startsWith('/admin/staff')) ||
                               (t.label === 'Blog' && location.pathname.startsWith('/admin/blog'))

              const base = `px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-white/20 ring-2 ring-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]' : 'hover:bg-white/10'}`

              if (t.label === 'Tổng quan') {
                return (
                  <NavLink key={t.label} to="/admin" className={base}>{t.label}</NavLink>
                )
              }

              if (t.label === 'Đơn hàng') {
                return (
                  <div
                    key={t.label}
                    className="relative"
                    onMouseEnter={() => setIsOrdersOpen(true)}
                    onMouseLeave={() => {
                      // Delay đóng dropdown để tránh đóng khi di chuột vào dropdown
                      ordersTimeoutRef.current = setTimeout(() => {
                        setIsOrdersOpen(false)
                      }, 100)
                    }}
                    ref={ordersRef}
                  >
                    <button className={base} aria-haspopup="true" aria-expanded={isOrdersOpen} onClick={() => setIsOrdersOpen((v) => !v)}>
                      {t.label}
                    </button>
                    {isOrdersOpen && (
                      <div 
                        className="absolute left-0 top-12 z-40"
                        onMouseEnter={() => {
                          // Clear timeout khi di chuột vào dropdown
                          if (ordersTimeoutRef.current) {
                            clearTimeout(ordersTimeoutRef.current)
                            ordersTimeoutRef.current = null
                          }
                          setIsOrdersOpen(true)
                        }}
                        onMouseLeave={() => {
                          // Delay đóng dropdown
                          ordersTimeoutRef.current = setTimeout(() => {
                            setIsOrdersOpen(false)
                          }, 100)
                        }}
                      >
                        {/* Bridge để tránh mất hover */}
                        <div className="h-2 w-full"></div>
                        <div className="bg-white text-gray-900 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.15)] w-[720px] p-6 border border-green-100">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-xl font-semibold mb-6">Đơn hàng</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><Link to="/admin/orders" className="hover:text-green-600 transition-colors" onClick={() => setIsOrdersOpen(false)}>Danh sách đơn hàng</Link></li>
                                <li><Link to="/admin/orders/create" className="hover:text-green-600 transition-colors" onClick={() => setIsOrdersOpen(false)}>Tạo đơn hàng thường</Link></li>
                                <li><Link to="/admin/orders/create-custom" className="hover:text-green-600 transition-colors" onClick={() => setIsOrdersOpen(false)}>Tạo đơn hàng custom</Link></li>
                                <li><button className="hover:text-green-600 transition-colors">Vận đơn</button></li>
                              </ul>
                            </div>
                            <div className="border-l border-gray-200 pl-8">
                              <div className="text-xl font-semibold mb-6">Thống kê</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><button className="hover:text-green-600 transition-colors">Báo cáo doanh thu</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Đơn hàng chờ xử lý</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Đơn hàng đang giao</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Đơn hàng hoàn thành</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (t.label === 'Khách hàng') {
                return (
                  <div
                    key={t.label}
                    className="relative"
                    onMouseEnter={() => setIsCustomersOpen(true)}
                    onMouseLeave={() => {
                      customersTimeoutRef.current = setTimeout(() => {
                        setIsCustomersOpen(false)
                      }, 100)
                    }}
                    ref={customersRef}
                  >
                    <button 
                      className={base} 
                      aria-haspopup="true" 
                      aria-expanded={isCustomersOpen} 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsCustomersOpen((v) => !v)
                      }}
                    >
                      {t.label}
                    </button>
                    {isCustomersOpen && (
                      <div 
                        className="absolute left-0 top-12 z-40"
                        onMouseEnter={() => {
                          if (customersTimeoutRef.current) {
                            clearTimeout(customersTimeoutRef.current)
                            customersTimeoutRef.current = null
                          }
                          setIsCustomersOpen(true)
                        }}
                        onMouseLeave={() => {
                          customersTimeoutRef.current = setTimeout(() => {
                            setIsCustomersOpen(false)
                          }, 100)
                        }}
                      >
                        <div className="h-2 w-full"></div>
                        <div className="bg-white text-gray-900 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.15)] w-[720px] p-6 border border-green-100">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-xl font-semibold mb-6">Khách hàng</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><Link to="/admin/customers" className="hover:text-green-600 transition-colors" onClick={() => setIsCustomersOpen(false)}>Danh sách khách hàng</Link></li>
                                <li><button className="hover:text-green-600 transition-colors">Thêm khách hàng mới</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Phân loại khách hàng</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Lịch sử mua hàng</button></li>
                              </ul>
                            </div>
                            <div className="border-l border-gray-200 pl-8">
                              <div className="text-xl font-semibold mb-6">Thống kê</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><button className="hover:text-green-600 transition-colors">Khách hàng VIP</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Khách hàng mới</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Khách hàng tiềm năng</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Báo cáo khách hàng</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (t.label === 'Nhân Viên') {
                return (
                  <div
                    key={t.label}
                    className="relative"
                    onMouseEnter={() => setIsStaffOpen(true)}
                    onMouseLeave={() => {
                      staffTimeoutRef.current = setTimeout(() => {
                        setIsStaffOpen(false)
                      }, 100)
                    }}
                    ref={staffRef}
                  >
                    <button 
                      className={base} 
                      aria-haspopup="true" 
                      aria-expanded={isStaffOpen} 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsStaffOpen((v) => !v)
                      }}
                    >
                      {t.label}
                    </button>
                    {isStaffOpen && (
                      <div 
                        className="absolute left-0 top-12 z-40"
                        onMouseEnter={() => {
                          if (staffTimeoutRef.current) {
                            clearTimeout(staffTimeoutRef.current)
                            staffTimeoutRef.current = null
                          }
                          setIsStaffOpen(true)
                        }}
                        onMouseLeave={() => {
                          staffTimeoutRef.current = setTimeout(() => {
                            setIsStaffOpen(false)
                          }, 100)
                        }}
                      >
                        <div className="h-2 w-full"></div>
                        <div className="bg-white text-gray-900 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.15)] w-[720px] p-6 border border-green-100">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-xl font-semibold mb-6">Nhân viên</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><Link to="/admin/staff" className="hover:text-green-600 transition-colors" onClick={() => setIsStaffOpen(false)}>Danh sách nhân viên</Link></li>
                                <li><button className="hover:text-green-600 transition-colors">Thêm nhân viên mới</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Phân quyền</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Quản lý ca làm việc</button></li>
                              </ul>
                            </div>
                            <div className="border-l border-gray-200 pl-8">
                              <div className="text-xl font-semibold mb-6">Báo cáo</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><button className="hover:text-green-600 transition-colors">Hiệu suất làm việc</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Lương thưởng</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Chấm công</button></li>
                                <li><button className="hover:text-green-600 transition-colors">Đánh giá nhân viên</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              // Thêm vận đơn chỗ này 

              if (t.label === 'Hàng hóa') {
                return (
                  <div
                    key={t.label}
                    className="relative"
                    onMouseEnter={() => setIsGoodsOpen(true)}
                    onMouseLeave={() => {
                      // Delay đóng dropdown để tránh đóng khi di chuột vào dropdown
                      goodsTimeoutRef.current = setTimeout(() => {
                        setIsGoodsOpen(false)
                      }, 100)
                    }}
                    ref={goodsRef}
                  >
                    <button className={base} aria-haspopup="true" aria-expanded={isGoodsOpen} onClick={() => setIsGoodsOpen((v) => !v)}>
                      {t.label}
                    </button>
                    {isGoodsOpen && (
                      <div 
                        className="absolute left-0 top-12 z-40"
                        onMouseEnter={() => {
                          // Clear timeout khi di chuột vào dropdown
                          if (goodsTimeoutRef.current) {
                            clearTimeout(goodsTimeoutRef.current)
                            goodsTimeoutRef.current = null
                          }
                          setIsGoodsOpen(true)
                        }}
                        onMouseLeave={() => {
                          // Delay đóng dropdown
                          goodsTimeoutRef.current = setTimeout(() => {
                            setIsGoodsOpen(false)
                          }, 100)
                        }}
                      >
                        {/* Bridge để tránh mất hover */}
                        <div className="h-2 w-full"></div>
                        <div className="bg-white text-gray-900 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.15)] w-[720px] p-6 border border-green-100">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-xl font-semibold mb-6">Hàng hóa</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><Link to="/admin/products" className="hover:text-green-600 transition-colors">Danh sách hàng hóa</Link></li>
                                <li>
                                  <Link to="/admin/categories" className="hover:text-green-600 transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Danh mục sản phẩm
                                  </Link>
                                </li>
                                <li><button className="hover:text-green-600 transition-colors">Thiết lập giá</button></li>
                              </ul>
                            </div>
                            <div className="border-l border-gray-200 pl-8">
                              <div className="text-xl font-semibold mb-6">Kho hàng</div>
                              <ul className="space-y-6 text-gray-800">
                                <li>
                                  <Link to="/admin/warehouses" className="hover:text-green-600 transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Quản lý kho hàng
                                  </Link>
                                </li>
                                <li>
                                  <Link to="/admin/viettelpost" className="hover:text-green-600 transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Tích hợp ViettelPost
                                  </Link>
                                </li>
                                <li>
                                  <Link to="/admin/warehouse-stock" className="hover:text-green-600 transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Quản lý stock
                                  </Link>
                                </li>
                                <li><button className="hover:text-green-600 transition-colors">Kiểm kho</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }


              if (t.label === 'Blog') {
                return (
                  <NavLink key={t.label} to="/admin/blog" className={base}>
                    {t.label}
                  </NavLink>
                )
              }

              return (
                <button key={t.label} className={base}>
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className="ml-2 text-[10px] bg-[#ffb300] text-[#263238] font-bold px-1.5 py-0.5 rounded">{t.badge}</span>
                  )}
                </button>
              )
            })}
          </div>
          <button className="flex items-center bg-white text-green-600 font-semibold px-4 py-2 rounded-lg text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-green-200 hover:border-green-300">
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A1.99 1.99 0 006 20h12v-2H7.42a.25.25 0 01-.22-.37L8.1 15h7.45a2 2 0 001.8-1.1l3.58-6.49A1 1 0 0019.99 6H6.21l.94-2z"/></svg>
            Bán hàng
          </button>
        </div>
      </div>

    </div>
  )
}

export default TopNav


