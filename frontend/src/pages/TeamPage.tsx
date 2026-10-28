import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useState } from 'react'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { TeamPanel } from '../features/team/TeamPanel'

export function TeamPage() {
  const { projects, project } = useSelectedProject()
  const [newProjectVisible, setNewProjectVisible] = useState(false)

  if (projects === undefined) {
    return (
      <div className="flex justify-center py-20">
        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-brand-ink">Create your first project</h1>
        <p className="mt-2 text-sm text-slate-600">Set up a project to start building its team.</p>
        <Button label="New project" icon="pi pi-plus" className="mt-6" onClick={() => setNewProjectVisible(true)} />
        <NewProjectDialog visible={newProjectVisible} onHide={() => setNewProjectVisible(false)} />
      </div>
    )
  }

  return <TeamPanel key={project.id} projectId={project.id} projectName={project.name} />
}
