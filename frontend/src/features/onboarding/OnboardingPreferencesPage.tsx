import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { OnboardingShell } from './OnboardingShell'
import { useOnboardingOptions, useUpdatePreferences } from './onboarding.hooks'

const detectedTimeZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
})()

interface Field {
  key: 'measurementSystem' | 'currency' | 'timeZoneId' | 'temperatureUnit'
  label: string
}

const FIELDS: Field[] = [
  { key: 'measurementSystem', label: 'Measurement System' },
  { key: 'currency', label: 'Currency' },
  { key: 'timeZoneId', label: 'Timezone' },
  { key: 'temperatureUnit', label: 'Temperature' },
]

export function OnboardingPreferencesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: options, isLoading } = useOnboardingOptions()
  const mutation = useUpdatePreferences()

  const [values, setValues] = useState({
    measurementSystem: user?.measurementSystem || 'Metric',
    currency: user?.currency || 'USD',
    timeZoneId: user?.timeZoneId && user.timeZoneId !== 'UTC' ? user.timeZoneId : detectedTimeZone,
    temperatureUnit: user?.temperatureUnit || 'Celsius',
  })

  const set = (key: Field['key'], value: string) => setValues((v) => ({ ...v, [key]: value }))

  const handleContinue = () => {
    mutation.mutate(values, { onSuccess: () => navigate('/onboarding/company') })
  }

  return (
    <OnboardingShell
      title="Let's set up your dashboard"
      subcopy="Adjust the pre-filled settings to your preference. You can always update these later in your company settings."
      onContinue={handleContinue}
      onSkip={() => navigate('/onboarding/company')}
      continueLoading={mutation.isPending}
      continueDisabled={isLoading || !options}
      error={mutation.isError ? 'Could not save your preferences. Please try again.' : null}
    >
      {isLoading || !options ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        FIELDS.map((field) => {
          const dropdownOptions =
            field.key === 'measurementSystem'
              ? options.measurementSystems
              : field.key === 'currency'
                ? options.currencies
                : field.key === 'timeZoneId'
                  ? options.timeZones
                  : options.temperatureUnits
          return (
            <div key={field.key} className="flex flex-col gap-2">
              <label htmlFor={field.key} className="text-[15px] font-semibold text-slate-800">
                {field.label}
              </label>
              <Dropdown
                inputId={field.key}
                value={values[field.key]}
                options={dropdownOptions}
                optionLabel="label"
                optionValue={field.key === 'currency' ? 'code' : field.key === 'timeZoneId' ? 'id' : 'value'}
                filter={field.key === 'timeZoneId' || field.key === 'currency'}
                onChange={(e) => set(field.key, e.value)}
                className="w-full"
              />
            </div>
          )
        })
      )}
    </OnboardingShell>
  )
}
