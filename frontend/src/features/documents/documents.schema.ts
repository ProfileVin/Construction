import { z } from 'zod'

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

// Mirrors DocumentUploadRules.AllowedExtensions on the API.
export const ALLOWED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.tif', '.tiff', '.bmp',
  '.pdf',
  '.doc', '.docx', '.odt', '.rtf',
  '.xls', '.xlsx', '.csv', '.ods',
  '.dwg', '.dxf', '.txt', '.zip',
]

const extensionOf = (fileName: string) => {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : ''
}

export const uploadDocumentSchema = z.object({
  file: z
    .instanceof(File, { message: 'Choose a file to upload' })
    .refine((f) => f.size > 0, 'The file is empty')
    .refine((f) => f.size <= MAX_UPLOAD_BYTES, 'Files must be 100 MB or smaller')
    .refine((f) => ALLOWED_EXTENSIONS.includes(extensionOf(f.name)), "This file type isn't supported"),
  name: z.string().max(260, 'Keep the name under 260 characters').optional(),
  phaseId: z.string().nullable().optional(),
})

export type UploadDocumentValues = z.infer<typeof uploadDocumentSchema>
