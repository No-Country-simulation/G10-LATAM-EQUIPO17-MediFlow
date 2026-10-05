import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import './dashboard.css'

const SIDEBAR_KEY = 'mediflow.sidebarCollapsed'

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true')
  const { pathname } = useLocation()

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
  }, [collapsed])

  const toggleCollapsed = () => setCollapsed((value) => !value)

  return (
    <div className={collapsed ? 'dashboard-layout is-collapsed' : 'dashboard-layout'}>
      <DashboardSidebar collapsed={collapsed} onToggle={toggleCollapsed} pathname={pathname} />
      <div className="dashboard-main">
        <DashboardHeader onToggle={toggleCollapsed} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout