import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import heroImageUrl from '../../assets/login-hero.jpg'
import { SplitLayout } from '../../components/SplitLayout'
import { selectIsAuthenticated, useAuthStore } from '../../stores/authStore'
import { PasswordChecklist } from './PasswordChecklist'
import { registerSchema, type RegisterValues } from './auth.schema'
import { getRegisterErrorMessage, useRegister } from './useRegister'

const COUNTRY_CODES = ['+1', '+44', '+61', '+63', '+65', '+81', '+91'].map((c) => ({
  label: c,
  value: c,
}))

export function RegisterPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const mutation = useRegister()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      countryCode: '+1',
      phoneNumber: '',
      password: '',
      excludeFromMarketing: false,
    },
  })

  const passwordValue = useWatch({ control, name: 'password' })

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

        <h1 className="mt-8 text-[32px] font-extrabold text-brand">Sign up for free</h1>
        <p className="mt-2 text-[15px] text-slate-500">Create your account in a minute</p>
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
          <label htmlFor="phoneNumber" className="text-[15px] font-semibold text-slate-800">
            Phone number
          </label>
          <div className="phone-field" data-invalid={Boolean(errors.phoneNumber)}>
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <Dropdown
                  aria-label="Country calling code"
                  options={COUNTRY_CODES}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
            <span className="phone-field__divider" aria-hidden="true" />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <InputText
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel-national"
                  placeholder="Enter phone number"
                  {...field}
                />
              )}
            />
          </div>
          {errors.phoneNumber && (
            <small className="text-[13px] text-red-600">{errors.phoneNumber.message}</small>
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
                autoComplete="new-password"
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
          <PasswordChecklist value={passwordValue} />
        </div>

        <Controller
          name="excludeFromMarketing"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-3 text-[13px] text-slate-600">
              <Checkbox
                inputId="excludeFromMarketing"
                checked={field.value}
                onChange={(e) => field.onChange(e.checked ?? false)}
              />
              <span>
                Please exclude me from future product update and marketing emails.
              </span>
            </label>
          )}
        />

        <p className="text-[13px] leading-relaxed text-slate-600">
          By registering for an account, you are consenting to our{' '}
          <a href="#terms" className="text-brand underline">
            Terms of Service
          </a>{' '}
          and confirming that you have reviewed and accepted the{' '}
          <a href="#privacy" className="text-brand underline">
            Privacy Statement
          </a>
          .
        </p>

        {mutation.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getRegisterErrorMessage(mutation.error)}
          </div>
        )}

        <Button
          type="submit"
          label="Get started for free"
          loading={mutation.isPending}
          className="mt-1 w-full"
        />
      </form>

      <p className="mt-6 text-center text-[15px] text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Login
        </Link>
      </p>
    </SplitLayout>
  )
}
