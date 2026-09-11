import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useForm } from 'react-hook-form'
import { useProjectStore } from '../../stores/projectStore'
import { ProjectFormFields } from './ProjectFormFields'
import { useCreateProject, useProjectOptions } from './projects.hooks'
import { createProjectSchema, type CreateProjectValues } from './projects.schema'

interface NewProjectDialogProps {
  visible: boolean
  onHide: () => void
}

export function NewProjectDialog({ visible, onHide }: NewProjectDialogProps) {
  const { data: options, isLoading } = useProjectOptions()
  const createProject = useCreateProject()
  const setSelectedProjectId = useProjectStore((s) => s.setSelectedProjectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', type: '', status: 'New', description: '' },
  })

  const submit = handleSubmit(async (values) => {
    const project = await createProject.mutateAsync({
      name: values.name,
      type: values.type,
      status: values.status,
      description: values.description || null,
    })
    setSelectedProjectId(project.id)
    reset()
    onHide()
  })

  return (
    <Dialog
      header="New project"
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: '32rem' }}
      className="mx-4"
    >
      {isLoading || !options ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <ProjectFormFields control={control} errors={errors} options={options} />

          {createProject.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Could not create the project. Please check the details and try again.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" label="Cancel" outlined onClick={onHide} />
            <Button type="submit" label="Create project" loading={createProject.isPending} />
          </div>
        </form>
      )}
    </Dialog>
  )
}
