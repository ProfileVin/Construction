import { Button } from 'primereact/button'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import heroImageUrl from '../../assets/login-hero.jpg'
import { LogoMark } from '../../components/LogoMark'
import { SplitLayout } from '../../components/SplitLayout'
import { selectIsAuthenticated, useAuthStore } from '../../stores/authStore'

interface OnboardingShellProps {
  title: string
  subcopy: string
  children: ReactNode
  onContinue: () => void
  onSkip: () => void
  continueLabel?: string
  continueLoading?: boolean
  continueDisabled?: boolean
  error?: string | null
}

export function OnboardingShell({
  title,
  subcopy,
  children,
  onContinue,
  onSkip,
  continueLabel = 'Continue',
  continueLoading = false,
  continueDisabled = false,
  error,
}: OnboardingShellProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <SplitLayout
      heroImageUrl={heroImageUrl}
      headline="Build the day, on schedule."
      subcopy="Every crew, every task, and every document in one place."
    >
      <div className="flex flex-col items-center text-center">
        <LogoMark />
        <h1 className="mt-8 text-[28px] font-extrabold text-brand sm:text-[32px]">{title}</h1>
        <p className="mt-2 max-w-md text-[15px] text-slate-500">{subcopy}</p>
      </div>

      <div className="mt-9 flex flex-col gap-6">{children}</div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button
          type="button"
          label={continueLabel}
          loading={continueLoading}
          disabled={continueDisabled}
          className="w-full"
          onClick={onContinue}
        />
        <Button
          type="button"
          label="Skip"
          outlined
          className="w-full !text-slate-500 !border-slate-300"
          onClick={onSkip}
        />
      </div>
    </SplitLayout>
  )
}
