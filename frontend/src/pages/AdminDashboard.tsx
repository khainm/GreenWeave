import React from 'react'
import TopNav from '../components/admin/TopNav'
import StatCards from '../components/admin/StatCards'
import RevenueChart from '../components/admin/RevenueChart'
import ActivityPanel from '../components/admin/ActivityPanel'

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-8">
          <StatCards />
          <RevenueChart />
        </div>

        <div className="lg:col-span-3">
          <ActivityPanel />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard


