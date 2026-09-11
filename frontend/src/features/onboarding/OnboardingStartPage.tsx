import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SelectableCard } from '../../components/SelectableCard'
import { OnboardingShell } from './OnboardingShell'

const CHOICES = [
  {
    mode: 'Scratch',
    title: 'Create a project from scratch',
    description: 'Start from scratch and build your project by filling in your own data',
  },
  {
    mode: 'Template',
    title: 'Choose from project template',
    description: 'Select a project template from our list of templates',
  },
] as const

export function OnboardingStartPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<string>('Scratch')

  return (
    <OnboardingShell
      title="What do you want to do?"
      subcopy="Choose how you want to proceed and we'll help you get started"
      onContinue={() => navigate('/onboarding/project', { state: { startMode: mode } })}
      onSkip={() => navigate('/', { replace: true })}
    >
      <div role="radiogroup" aria-label="How do you want to start?" className="grid gap-4 sm:grid-cols-2">
        {CHOICES.map((choice) => (
          <SelectableCard
            key={choice.mode}
            title={choice.title}
            description={choice.description}
            selected={mode === choice.mode}
            onSelect={() => setMode(choice.mode)}
          />
        ))}
      </div>
    </OnboardingShell>
  )
}
