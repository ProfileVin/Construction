import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ProgressBar } from 'primereact/progressbar'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { formatFileSize } from '../../lib/format'
import { useUploadDocument } from './documents.hooks'
import { ALLOWED_EXTENSIONS, uploadDocumentSchema, type UploadDocumentValues } from './documents.schema'

function getUploadErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    // Kestrel's body-size rejection surfaces as a raw model-binding message — map it to ours.
    if (error.response?.status === 413 || first?.includes('too large')) return 'Files must be 100 MB or smaller.'
    if (first) return first
  }
  return 'Could not upload the document. Please try again.'
}

interface UploadDocumentDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function UploadDocumentDialog({ projectId, visible, onHide }: UploadDocumentDialogProps) {
  const upload = useUploadDocument(projectId)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadDocumentValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: { name: '' },
  })

  const close = () => {
    if (upload.isPending) return
    reset()
    upload.reset()
    setProgress(0)
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    setProgress(0)
    await upload.mutateAsync({
      file: values.file,
      name: values.name?.trim() || undefined,
      onProgress: setProgress,
    })
    close()
  })

  const labelClass = 'text-[14px] font-medium text-slate-900'

  return (
    <Dialog
      header="Upload New Document"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!upload.isPending}
      closable={!upload.isPending}
      draggable={false}
      style={{ width: '40rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="documentName" className={labelClass}>
            Document Title / Display Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="documentName"
                autoFocus
                placeholder="Title"
                className="w-full"
                invalid={Boolean(errors.name)}
                {...field}
              />
            )}
          />
          {errors.name && <small className="text-[13px] text-red-600">{errors.name.message}</small>}
        </div>

        <Controller
          name="file"
          control={control}
          render={({ field }) => {
            const pick = (file: File | undefined) => file && field.onChange(file)
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span id="documentFileLabel" className={labelClass}>
                    Source File Attachment
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Max: 100 MB</span>
                </div>
                <button
                  type="button"
                  aria-labelledby="documentFileLabel"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    pick(e.dataTransfer.files[0])
                  }}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
                    dragging
                      ? 'border-brand bg-brand/5'
                      : errors.file
                        ? 'border-red-300 bg-slate-100'
                        : 'border-slate-300 bg-slate-100 hover:border-brand'
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm" aria-hidden>
                    <i className="pi pi-cloud-upload text-2xl text-brand" />
                  </span>
                  {field.value ? (
                    <>
                      <span className="max-w-full truncate text-base font-semibold text-slate-900" title={field.value.name}>
                        {field.value.name}
                      </span>
                      <span className="text-sm text-slate-500">{formatFileSize(field.value.size)} · click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[17px] font-semibold text-slate-900">
                        Drag and drop files here, or <span className="text-brand underline">browse files</span>
                      </span>
                      <span className="max-w-md text-sm text-slate-500">
                        Supports DWG, DXF, IFC, PDF, XLSX, DOCX, PNG, and high-res scan bundles.
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  className="hidden"
                  onChange={(e) => {
                    pick(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                {errors.file && <small className="text-[13px] text-red-600">{errors.file.message}</small>}
              </div>
            )
          }}
        />

        {upload.isPending && <ProgressBar value={progress} style={{ height: '8px' }} showValue={false} />}

        {upload.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getUploadErrorMessage(upload.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={upload.isPending} />
          <Button type="submit" label="Upload" loading={upload.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
