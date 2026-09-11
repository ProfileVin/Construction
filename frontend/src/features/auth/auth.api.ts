import { api } from '../../lib/api'
import type { AuthUser } from '../../stores/authStore'
import type { LoginValues, RegisterValues } from './auth.schema'

export interface LoginResponse {
  token: string
  expiresAt: string
  user: AuthUser
}

export async function login(values: LoginValues): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', values)
  return data
}

export interface RegisterPayload {
  email: string
  phoneNumber: string | null
  password: string
  excludeFromMarketing: boolean
}

export async function register(values: RegisterValues): Promise<LoginResponse> {
  const trimmed = values.phoneNumber.trim()
  const payload: RegisterPayload = {
    email: values.email,
    phoneNumber: trimmed ? `${values.countryCode} ${trimmed}` : null,
    password: values.password,
    excludeFromMarketing: values.excludeFromMarketing,
  }
  const { data } = await api.post<LoginResponse>('/auth/register', payload)
  return data
}

export async function me(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me')
  return data
}
