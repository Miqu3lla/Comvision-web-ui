import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import TopNav from './TopNav'
import LabSidebar from './LabSidebar'
import Footer from '../home/Footer'

export default function AppShell() {
  const { pathname } = useLocation()
  const isLab = pathname.startsWith('/lab/')
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8">
        {isLab && <LabSidebar />}
        <div className="min-w-0 flex-1"><Outlet /></div>
      </main>
      <Footer />
    </div>
  )
}
