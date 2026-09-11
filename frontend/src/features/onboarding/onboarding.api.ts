import { api } from '../../lib/api'
import type { AuthUser } from '../../stores/authStore'

export interface LabeledOption {
  value: string
  label: string
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  label: string
}

export interface TimeZoneOption {
  id: string
  label: string
  gmtOffsetMinutes: number
}

export interface CompanyOption {
  value: string
  label: string
  hint: string | null
}

export interface OnboardingOptions {
  measurementSystems: LabeledOption[]
  currencies: CurrencyOption[]
  timeZones: TimeZoneOption[]
  temperatureUnits: LabeledOption[]
  companyDescriptions: CompanyOption[]
}

export interface PreferencesPayload {
  measurementSystem: string
  currency: string
  timeZoneId: string
  temperatureUnit: string
}

export async function getOnboardingOptions(): Promise<OnboardingOptions> {
  const { data } = await api.get<OnboardingOptions>('/onboarding/options')
  return data
}

export async function updatePreferences(payload: PreferencesPayload): Promise<AuthUser> {
  const { data } = await api.put<AuthUser>('/onboarding/preferences', payload)
  return data
}

export async function updateCompany(companyDescription: string): Promise<AuthUser> {
  const { data } = await api.put<AuthUser>('/onboarding/company', { companyDescription })
  return data
}

export async function completeOnboarding(startMode: string | null): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/onboarding/complete', { startMode })
  return data
}
