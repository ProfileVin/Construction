import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { login } from './auth.api'

interface ApiErrorBody {
  message?: string
}

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      navigate('/', { replace: true })
    },
  })
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const body = error.response.data as ApiErrorBody
      return body?.message ?? 'Unable to sign in. Please try again.'
    }
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
