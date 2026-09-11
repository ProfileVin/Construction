import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginValues = z.infer<typeof loginSchema>

/** Password rules — the single source of truth for the schema and the live checklist. */
export const passwordChecks: { id: string; label: string; test: (v: string) => boolean }[] = [
  { id: 'lower', label: 'One lowercase character', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', label: 'One uppercase character', test: (v) => /[A-Z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
  { id: 'length', label: '8 characters minimum', test: (v) => v.length >= 8 },
]

export const isPasswordStrong = (v: string) => passwordChecks.every((c) => c.test(v))

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  countryCode: z.string().min(1),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[0-9][0-9\s-]{5,18}$/.test(v), 'Enter a valid phone number'),
  password: z
    .string()
    .min(1, 'Password is required')
    .refine(isPasswordStrong, 'Password does not meet all the requirements'),
  excludeFromMarketing: z.boolean(),
})

export type RegisterValues = z.infer<typeof registerSchema>
