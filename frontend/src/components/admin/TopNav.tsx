import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan' },
  { label: 'Hàng hóa' },
  { label: 'Đơn hàng' },
  { label: 'Khách hàng' },
  { label: 'Nhân Viên' },
  { label: 'Kho hàng' },
  { label: 'Báo cáo', badge: 'Mới' },
  { label: 'Bán online' }
]

const Icon = ({ children }: { children: React.ReactNode }) => (
  <div className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer">
    {children}
  </div>
)

const TopNav: React.FC = () => {
  const location = useLocation()
  const [isGoodsOpen, setIsGoodsOpen] = useState(false)
  const goodsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (goodsRef.current && !goodsRef.current.contains(e.target as Node)) {
        setIsGoodsOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <div className="w-full">
      {/* Top white bar */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#eaf2ff] to-white border border-[#8fb9ff] text-[#0a68ff] font-bold shadow-sm">GW</div>
            <div className="text-xl font-semibold text-gray-900 tracking-wide">GreenWeave</div>
          </div>
          <div className="flex items-center space-x-1 text-gray-700">
            <div className="hidden md:flex items-center text-gray-700 mr-1">
              <span className="relative mr-2">
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 15a1 1 0 001 1h1l1 4h10l1-4h1a1 1 0 001-1v-4H4v4zm0-6h16l-2-5H6L4 9z"/></svg>
              </span>
              <span className="text-sm">Giao hàng</span>
            </div>

            <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></Icon>
            <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4.97 0 9-3.582 9-8 0-1.613-.51-3.113-1.383-4.38L12 2 4.383 9.62A7.936 7.936 0 003 14c0 4.418 4.03 8 9 8z"/></svg></Icon>
            <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></Icon>
            <Icon>
              <div className="relative">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><path d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z"/></svg>
              </div>
            </Icon>
            <div className="flex items-center text-sm px-2">
              <span className="mr-1">VI</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
            <div className="relative">
              <Icon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"/></svg>
              </Icon>
              <span className="absolute -top-1 right-0 bg-red-600 text-white text-xs rounded-full px-1">3</span>
            </div>
            <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 110-8 4 4 0 010 8zm0 2c-4.418 0-8 3.134-8 7h16c0-3.866-3.582-7-8-7z"/></svg></Icon>
            <Icon><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"/></svg></Icon>
          </div>
        </div>
      </div>

      {/* Blue tabs bar */}
      <div className="bg-gradient-to-r from-[#0a68ff] via-[#0d6efd] to-[#1270ff] text-white relative">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {tabs.map((t) => {
              const isActive = (t.label === 'Tổng quan' && location.pathname === '/admin') ||
                               (t.label === 'Hàng hóa' && location.pathname.startsWith('/admin/products')) ||
                               (t.label === 'Đơn hàng' && location.pathname.startsWith('/admin/orders')) ||
                               (t.label === 'Khách hàng' && location.pathname.startsWith('/admin/customers')) ||
                               (t.label === 'Nhân Viên' && location.pathname.startsWith('/admin/staff')) ||
                               (t.label === 'Kho hàng' && location.pathname.startsWith('/admin/warehouses'))

              const base = `px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-white/20 ring-2 ring-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]' : 'hover:bg-white/10'}`

              if (t.label === 'Tổng quan') {
                return (
                  <NavLink key={t.label} to="/admin" className={base}>{t.label}</NavLink>
                )
              }

              if (t.label === 'Đơn hàng') {
                return (
                  <NavLink key={t.label} to="/admin/orders" className={base}>
                    {t.label}
                  </NavLink>
                )
              }

              if (t.label === 'Khách hàng') {
                return (
                  <NavLink key={t.label} to="/admin/customers" className={base}>
                    {t.label}
                  </NavLink>
                )
              }

              if (t.label === 'Nhân Viên') {
                return (
                  <NavLink key={t.label} to="/admin/staff" className={base}>
                    {t.label}
                  </NavLink>
                )
              }
              // Thêm vận đơn chỗ này 

              if (t.label === 'Hàng hóa') {
                return (
                  <div
                    key={t.label}
                    className="relative"
                    onMouseEnter={() => setIsGoodsOpen(true)}
                    onMouseLeave={() => setIsGoodsOpen(false)}
                    ref={goodsRef}
                  >
                    <button className={base} aria-haspopup="true" aria-expanded={isGoodsOpen} onClick={() => setIsGoodsOpen((v) => !v)}>
                      {t.label}
                    </button>
                    {isGoodsOpen && (
                      <div className="absolute left-0 top-10 z-40">
                        <div className="mt-2 bg-white text-gray-900 rounded-2xl shadow-[0_20px_40px_rgba(13,110,253,0.15)] w-[720px] p-6 border border-blue-100">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <div className="text-xl font-semibold mb-6">Hàng hóa</div>
                              <ul className="space-y-6 text-gray-800">
                                <li><Link to="/admin/products" className="hover:text-[#0a68ff] transition-colors">Danh sách hàng hóa</Link></li>
                                <li>
                                  <Link to="/admin/categories" className="hover:text-[#0a68ff] transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Danh mục sản phẩm
                                  </Link>
                                </li>
                                <li><button className="hover:text-[#0a68ff] transition-colors">Thiết lập giá</button></li>
                              </ul>
                            </div>
                            <div className="border-l border-gray-200 pl-8">
                              <div className="text-xl font-semibold mb-6">Kho hàng</div>
                              <ul className="space-y-6 text-gray-800">
                                <li>
                                  <Link to="/admin/warehouses" className="hover:text-[#0a68ff] transition-colors" onClick={() => setIsGoodsOpen(false)}>
                                    Quản lý kho hàng
                                  </Link>
                                </li>
                                <li><button className="hover:text-[#0a68ff] transition-colors">Kiểm kho</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (t.label === 'Kho hàng') {
                return (
                  <NavLink key={t.label} to="/admin/warehouses" className={base}>
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
          <button className="flex items-center bg-white text-[#0a68ff] font-semibold px-3 py-1.5 rounded-md text-sm shadow hover:shadow-md transition-shadow">
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A1.99 1.99 0 006 20h12v-2H7.42a.25.25 0 01-.22-.37L8.1 15h7.45a2 2 0 001.8-1.1l3.58-6.49A1 1 0 0019.99 6H6.21l.94-2z"/></svg>
            Bán hàng
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopNav


