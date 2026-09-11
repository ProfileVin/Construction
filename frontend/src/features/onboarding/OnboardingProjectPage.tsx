import { zodResolver } from '@hookform/resolvers/zod'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCompleteOnboarding } from './onboarding.hooks'
import { ProjectFormFields } from '../projects/ProjectFormFields'
import { useCreateProject, useProjectOptions } from '../projects/projects.hooks'
import { createProjectSchema, type CreateProjectValues } from '../projects/projects.schema'
import { OnboardingShell } from './OnboardingShell'

export function OnboardingProjectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const startMode = (location.state as { startMode?: string } | null)?.startMode ?? 'Scratch'

  const { data: options, isLoading } = useProjectOptions()
  const createProject = useCreateProject()
  const completeOnboarding = useCompleteOnboarding()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', type: '', status: 'New', description: '' },
  })

  const busy = createProject.isPending || completeOnboarding.isPending

  const submit = handleSubmit(async (values) => {
    await createProject.mutateAsync({
      name: values.name,
      type: values.type,
      status: values.status,
      description: values.description || null,
    })
    await completeOnboarding.mutateAsync(startMode)
    navigate('/', { replace: true })
  })

  return (
    <OnboardingShell
      title="Create your first project"
      subcopy="Give us the basics. You can add tasks, documents and the team once it's created."
      onContinue={submit}
      onSkip={() => navigate('/', { replace: true })}
      continueLabel="Create project"
      continueLoading={busy}
      continueDisabled={isLoading || !options}
      error={
        createProject.isError || completeOnboarding.isError
          ? 'Could not create the project. Please check the details and try again.'
          : null
      }
    >
      {isLoading || !options ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <ProjectFormFields control={control} errors={errors} options={options} />
      )}
    </OnboardingShell>
  )
}
