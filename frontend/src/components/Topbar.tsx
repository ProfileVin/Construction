import { Avatar } from 'primereact/avatar'
import { InputText } from 'primereact/inputtext'
import { Menu } from 'primereact/menu'
import type { MenuItem } from 'primereact/menuitem'
import { Sidebar } from 'primereact/sidebar'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NavLinks } from './NavLinks'
import { NAV_ITEMS } from './navItems'
import { SidebarLogo } from './SidebarLogo'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { initials } from '../lib/format'
import { useAuthStore } from '../stores/authStore'

export function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { project } = useSelectedProject()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuRef = useRef<Menu>(null)

  const currentNavLabel =
    NAV_ITEMS.find((item) => (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)))
      ?.label ?? 'Dashboard'

  const menuItems: MenuItem[] = [
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => {
        clearAuth()
        navigate('/login', { replace: true })
      },
    },
  ]

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <i className="pi pi-bars text-lg" />
        </button>
        <div className="min-w-0 truncate text-sm text-slate-500">
          <span className="font-medium text-slate-700">{project?.name ?? 'Project'}</span>
          <span className="mx-1.5">/</span>
          <span>{currentNavLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <span className="topbar-search hidden items-center gap-2 sm:flex">
          <i className="pi pi-search text-slate-400" />
          <InputText placeholder="Search ..." aria-label="Search" />
        </span>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          <i className="pi pi-bell text-lg" />
        </button>

        <button
          type="button"
          aria-label="Account menu"
          onClick={(e) => menuRef.current?.toggle(e)}
          className="rounded-full"
        >
          <Avatar label={initials(user?.fullName)} shape="circle" />
        </button>
        <Menu ref={menuRef} model={menuItems} popup />
      </div>

      <Sidebar visible={drawerOpen} onHide={() => setDrawerOpen(false)} className="w-72">
        <div className="flex flex-col gap-6">
          <SidebarLogo />
          <NavLinks onNavigate={() => setDrawerOpen(false)} />
        </div>
      </Sidebar>
    </header>
  )
}
