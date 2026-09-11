import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { register } from './auth.api'

interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

export function useRegister() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      navigate('/', { replace: true })
    },
  })
}

export function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const body = error.response.data as ApiErrorBody
      if (body?.message) return body.message
      const firstFieldError = body?.errors && Object.values(body.errors).flat()[0]
      return firstFieldError ?? 'Could not create your account. Please check your details and try again.'
    }
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
