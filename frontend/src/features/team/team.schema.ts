import { z } from 'zod'

// Mirrors SaveTeamMemberRequestValidator on the API.
export const teamMemberSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(200, 'Keep the name under 200 characters'),
  roleTitle: z.string().trim().min(1, 'Role / trade is required').max(200, 'Keep the role under 200 characters'),
  specialty: z.string().trim().max(200, 'Keep the specialty under 200 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(256, 'Keep the email under 256 characters'),
  phaseId: z.string().nullable(),
})

export type TeamMemberValues = z.infer<typeof teamMemberSchema>
