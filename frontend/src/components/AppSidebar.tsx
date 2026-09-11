import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel'
import { useRef, useState } from 'react'
import { LogoMark } from './LogoMark'
import { NavLinks } from './NavLinks'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { useProjectStore } from '../stores/projectStore'

export function AppSidebar() {
  const { projects, project } = useSelectedProject()
  const setSelectedProjectId = useProjectStore((s) => s.setSelectedProjectId)
  const [newProjectVisible, setNewProjectVisible] = useState(false)
  const switcherRef = useRef<OverlayPanel>(null)

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-slate-200 bg-white p-5 lg:flex">
      <div className="self-start">
        <LogoMark />
      </div>

      <Button
        label="New Project"
        icon="pi pi-plus"
        className="w-full"
        onClick={() => setNewProjectVisible(true)}
      />

      <button
        type="button"
        onClick={(e) => switcherRef.current?.toggle(e)}
        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-slate-800">
            {project?.name ?? 'No project'}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {project?.description || (project ? `${project.type} · ${project.status}` : 'Create a project')}
          </span>
        </span>
        <i className="pi pi-chevron-down text-xs text-slate-400" />
      </button>
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

      <NavLinks />

      <NewProjectDialog visible={newProjectVisible} onHide={() => setNewProjectVisible(false)} />
    </aside>
  )
}
