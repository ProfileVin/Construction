import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { ProgressBar } from 'primereact/progressbar'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { formatFileSize } from '../../lib/format'
import { usePhases } from '../schedule/schedule.hooks'
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
  const { data: phases } = usePhases(projectId)
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
    defaultValues: { name: '', phaseId: null },
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
      phaseId: values.phaseId ?? null,
      onProgress: setProgress,
    })
    close()
  })

  return (
    <Dialog
      header="Upload document"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!upload.isPending}
      closable={!upload.isPending}
      style={{ width: '30rem' }}
      className="mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Controller
          name="file"
          control={control}
          render={({ field }) => {
            const pick = (file: File | undefined) => file && field.onChange(file)
            return (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] font-semibold text-slate-800">File</span>
                <button
                  type="button"
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
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    dragging ? 'border-brand bg-brand/5' : errors.file ? 'border-red-300' : 'border-slate-300 hover:border-brand'
                  }`}
                >
                  <i className="pi pi-cloud-upload text-3xl text-brand" aria-hidden />
                  {field.value ? (
                    <>
                      <span className="max-w-full truncate text-sm font-semibold text-slate-800">{field.value.name}</span>
                      <span className="text-xs text-slate-500">{formatFileSize(field.value.size)} · click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-800">Drop a file here or click to browse</span>
                      <span className="text-xs text-slate-500">Images, PDF, Word, Excel, CAD · up to 100 MB</span>
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

        <div className="flex flex-col gap-2">
          <label htmlFor="documentName" className="text-[15px] font-semibold text-slate-800">
            Display name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="documentName"
                placeholder="Defaults to the file name"
                className="w-full"
                invalid={Boolean(errors.name)}
                {...field}
              />
            )}
          />
          {errors.name && <small className="text-[13px] text-red-600">{errors.name.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="documentPhase" className="text-[15px] font-semibold text-slate-800">
            Phase <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <Controller
            name="phaseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="documentPhase"
                value={field.value ?? null}
                options={(phases ?? []).map((p) => ({ label: p.name, value: p.id }))}
                optionLabel="label"
                optionValue="value"
                placeholder="No phase"
                showClear
                onChange={(e) => field.onChange(e.value)}
                className="w-full"
              />
            )}
          />
        </div>

        {upload.isPending && <ProgressBar value={progress} style={{ height: '8px' }} showValue={false} />}

        {upload.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getUploadErrorMessage(upload.error)}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={upload.isPending} />
          <Button type="submit" label="Upload" icon="pi pi-upload" loading={upload.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
