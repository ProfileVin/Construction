import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useRef, useState } from 'react'
import { NavLinks } from './NavLinks'
import { SidebarLogo } from './SidebarLogo'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { useProjectStore } from '../stores/projectStore'
import { useUiStore } from '../stores/uiStore'

export function AppSidebar() {
  const { projects, project } = useSelectedProject()
  const setSelectedProjectId = useProjectStore((s) => s.setSelectedProjectId)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const [newProjectVisible, setNewProjectVisible] = useState(false)
  const switcherRef = useRef<OverlayPanel>(null)

  return (
    <aside
      className={`relative z-10 hidden shrink-0 flex-col border-r border-slate-200 bg-[#f8f8f8] transition-[width] duration-200 lg:flex ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute -right-3 top-6 flex h-9 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-400 shadow-sm ring-1 ring-slate-200 hover:text-brand"
      >
        <i className="pi pi-code text-xs" />
      </button>

      <div className="flex justify-center border-b border-slate-200 py-6">
        <SidebarLogo compact={collapsed} />
      </div>

      <div className={`flex flex-col gap-4 border-b border-slate-200 py-5 ${collapsed ? 'px-3' : 'px-5'}`}>
        <Button
          label={collapsed ? undefined : 'New Project'}
          icon="pi pi-plus"
          aria-label="New Project"
          tooltip={collapsed ? 'New Project' : undefined}
          tooltipOptions={{ position: 'right' }}
          className="sidebar-new-project w-full"
          onClick={() => setNewProjectVisible(true)}
        />

        {!collapsed && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`Switch project (current: ${project?.name ?? 'none'})`}
            onClick={(e) => switcherRef.current?.toggle(e)}
            className="flex items-center gap-3 rounded-[10px] border border-slate-300 bg-white p-1.5 pr-3 text-left"
          >
            <span className="shrink-0 rounded-md bg-slate-200 px-3 py-2.5 text-[15px] font-medium text-slate-800">
              Project
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-slate-600">{project?.name ?? 'No project'}</span>
              <span className="block truncate text-xs text-slate-500">
                {project?.description || (project ? `${project.type} · ${project.status}` : 'Create a project')}
              </span>
            </span>
            <i className="pi pi-sort text-xs text-brand" />
          </button>
        )}
      </div>
      <OverlayPanel ref={switcherRef} className="w-72">
        <ul className="flex flex-col gap-1">
          {(projects ?? []).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(p.id)
                  switcherRef.current?.hide()
                }}
                className="w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                {p.name}
              </button>
            </li>
          ))}
          {(!projects || projects.length === 0) && (
            <li className="px-3 py-2 text-sm text-slate-500">No projects yet.</li>
          )}
        </ul>
      </OverlayPanel>

      <div className={`py-5 ${collapsed ? 'px-3' : 'px-5'}`}>
        <NavLinks collapsed={collapsed} />
      </div>

      <NewProjectDialog visible={newProjectVisible} onHide={() => setNewProjectVisible(false)} />
    </aside>
  )
}
