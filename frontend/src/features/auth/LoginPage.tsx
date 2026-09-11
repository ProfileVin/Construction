import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { SplitLayout } from '../../components/SplitLayout'
import { selectIsAuthenticated, useAuthStore } from '../../stores/authStore'
import { loginSchema, type LoginValues } from './auth.schema'
import { getLoginErrorMessage, useLogin } from './useLogin'
import heroImageUrl from '../../assets/login-hero.jpg'

export function LoginPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const mutation = useLogin()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <SplitLayout
      heroImageUrl={heroImageUrl}
      headline="Build the day, on schedule."
      subcopy="Every crew, every task, and every document in one place."
    >
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-white">
          <i className="pi pi-asterisk text-accent" />
          <span className="text-xl font-semibold">Construction</span>
        </span>

        <h1 className="mt-8 text-[32px] font-extrabold text-brand">Log in</h1>
        <p className="mt-2 text-[15px] text-slate-500">Log in to your dashboard</p>
      </div>

      <form onSubmit={onSubmit} className="mt-9 flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[15px] font-semibold text-slate-800">
            Email Address
          </label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputText
                id="email"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="Enter email"
                className="w-full"
                invalid={Boolean(errors.email)}
                {...field}
              />
            )}
          />
          {errors.email && (
            <small className="text-[13px] text-red-600">{errors.email.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[15px] font-semibold text-slate-800">
            Password<span className="text-red-500">*</span>
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Password
                inputId="password"
                autoComplete="current-password"
                placeholder="Enter password"
                toggleMask
                feedback={false}
                className="w-full"
                inputClassName="w-full"
                invalid={Boolean(errors.password)}
                {...field}
              />
            )}
          />
          {errors.password && (
            <small className="text-[13px] text-red-600">{errors.password.message}</small>
          )}
        </div>

        {mutation.isError && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            {getLoginErrorMessage(mutation.error)}
          </div>
        )}

        <Button
          type="submit"
          label="Log in"
          loading={mutation.isPending}
          className="mt-1 w-full"
        />
      </form>

      <p className="mt-6 text-center text-[15px] text-slate-600">
        Don&rsquo;t have an account?{' '}
        <Link to="/register" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </p>
    </SplitLayout>
  )
}
