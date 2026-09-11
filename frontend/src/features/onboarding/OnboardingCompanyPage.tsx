import { ProgressSpinner } from 'primereact/progressspinner'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SelectableCard } from '../../components/SelectableCard'
import { useAuthStore } from '../../stores/authStore'
import { OnboardingShell } from './OnboardingShell'
import { useOnboardingOptions, useUpdateCompany } from './onboarding.hooks'

export function OnboardingCompanyPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: options, isLoading } = useOnboardingOptions()
  const mutation = useUpdateCompany()

  const [choice, setChoice] = useState<string>(user?.companyDescription ?? 'Builder')

  const next = () => navigate('/onboarding/start')
  const handleContinue = () => mutation.mutate(choice, { onSuccess: next })

  return (
    <OnboardingShell
      title="How would you best describe your company?"
      subcopy="This helps us tailor templates and defaults to how you work."
      onContinue={handleContinue}
      onSkip={next}
      continueLoading={mutation.isPending}
      continueDisabled={isLoading || !options}
      error={mutation.isError ? 'Could not save that. Please try again.' : null}
    >
      {isLoading || !options ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <div role="radiogroup" aria-label="Company description" className="grid gap-4 sm:grid-cols-2">
          {options.companyDescriptions.map((option) => (
            <SelectableCard
              key={option.value}
              title={option.label}
              description={option.hint}
              selected={choice === option.value}
              onSelect={() => setChoice(option.value)}
            />
          ))}
        </div>
      )}
    </OnboardingShell>
  )
}
