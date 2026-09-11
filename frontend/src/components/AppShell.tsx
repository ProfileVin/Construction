import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-page p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
