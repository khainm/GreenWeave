import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user, logout } = useAuth()
  const [isGoodsOpen, setIsGoodsOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isCustomersOpen, setIsCustomersOpen] = useState(false)
  const [isStaffOpen, setIsStaffOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const goodsRef = useRef<HTMLDivElement | null>(null)
  const ordersRef = useRef<HTMLDivElement | null>(null)
  const customersRef = useRef<HTMLDivElement | null>(null)
  const staffRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const goodsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ordersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const customersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const staffTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
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
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current)
    }
  }, [])

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center text-sm">
              GW
            </div>
            <div className="text-lg font-semibold text-gray-900">
              GreenWeave
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600">
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 cursor-pointer hover:text-green-600 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 15a1 1 0 001 1h1l1 4h10l1-4h1a1 1 0 001-1v-4H4v4zm0-6h16l-2-5H6L4 9z"/>
                </svg>
                <span className="text-sm">Giao hàng</span>
              </div>
              
              <div className="flex items-center space-x-1 cursor-pointer hover:text-green-600 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                <span className="text-sm">Thông báo</span>
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
            </div>

            {/* User Profile */}
            <div 
              className="relative cursor-pointer"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => {
                profileTimeoutRef.current = setTimeout(() => {
                  setIsProfileOpen(false)
                }, 100)
              }}
              ref={profileRef}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div 
                  className="absolute right-0 top-10 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  onMouseEnter={() => {
                    if (profileTimeoutRef.current) {
                      clearTimeout(profileTimeoutRef.current)
                      profileTimeoutRef.current = null
                    }
                    setIsProfileOpen(true)
                  }}
                  onMouseLeave={() => {
                    profileTimeoutRef.current = setTimeout(() => {
                      setIsProfileOpen(false)
                    }, 100)
                  }}
                >
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.fullName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thông tin cá nhân
                    </Link>
                    
                    <Link 
                      to="/admin/settings" 
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Cài đặt
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button 
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false)
                        logout()
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {tabs.map((t) => {
              const isActive = (t.label === 'Tổng quan' && location.pathname === '/admin') ||
                               (t.label === 'Hàng hóa' && location.pathname.startsWith('/admin/products')) ||
                               (t.label === 'Đơn hàng' && location.pathname.startsWith('/admin/orders')) ||
                               (t.label === 'Khách hàng' && location.pathname.startsWith('/admin/customers')) ||
                               (t.label === 'Nhân Viên' && location.pathname.startsWith('/admin/staff')) ||
                               (t.label === 'Blog' && location.pathname.startsWith('/admin/blog'))

              const base = `px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`

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
                        className="absolute left-0 top-10 z-40"
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
                        className="absolute left-0 top-10 z-40"
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
                                <li><Link to="/admin/consultations" className="hover:text-green-600 transition-colors" onClick={() => setIsCustomersOpen(false)}>📞 Yêu cầu tư vấn</Link></li>
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
                        className="absolute left-0 top-10 z-40"
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
                        className="absolute left-0 top-10 z-40"
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


