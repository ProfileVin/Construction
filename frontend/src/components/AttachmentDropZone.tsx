import { useRef, useState, type ReactNode } from 'react'
import { ALLOWED_EXTENSIONS } from '../features/documents/documents.schema'
import { formatFileSize } from '../lib/format'

// `image/*` lets phones offer the camera; the allow-list still decides what's accepted.
const ACCEPT = ['image/*', ...ALLOWED_EXTENSIONS].join(',')

interface AttachmentDropZoneProps {
  label: ReactNode
  /** First line inside the empty drop zone, e.g. "Attach photo, CAD, or site document". */
  title: string
  /** Second line, e.g. accepted types and size. */
  hint?: string
  value: File | undefined
  onChange: (file: File | undefined) => void
  error?: string
  /** Smaller label and tighter gap for `.form-dialog--compact`. */
  compact?: boolean
  /** Lets Browse / drop pick several files; `onChange` is called once per file (the caller keeps the list). */
  multiple?: boolean
}

/** Dashed single-file picker (drag & drop or Browse) used by the task and log dialogs. */
export function AttachmentDropZone({
  label,
  title,
  hint = 'Tap to capture or upload (up to 25MB)',
  value: file,
  onChange,
  error,
  compact = false,
  multiple = false,
}: AttachmentDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pick = (files: FileList | null | undefined) => {
    for (const picked of Array.from(files ?? []).slice(0, multiple ? undefined : 1)) onChange(picked)
  }
  const browse = () => fileInputRef.current?.click()

  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      <span className={`${compact ? 'text-[13px] leading-[18px]' : 'text-sm'} font-medium text-slate-900`}>{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files)
        }}
      >
        {file ? (
          <div className={`assign-task-drop ${error ? 'is-invalid' : ''}`}>
            <span className="assign-task-drop__tile" aria-hidden>
              <i className="pi pi-file" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate text-sm font-medium text-slate-900" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
            </span>
            <button type="button" onClick={browse} className="assign-task-drop__pill">
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              aria-label={`Remove ${file.name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            >
              <i className="pi pi-times text-xs" aria-hidden />
            </button>
          </div>
        ) : (
          <button type="button" onClick={browse} className={`assign-task-drop w-full ${dragging ? 'is-dragging' : ''}`}>
            <span className="assign-task-drop__tile" aria-hidden>
              <i className="pi pi-camera" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span className="text-sm font-medium text-slate-900">{title}</span>
              <span className="text-xs text-slate-600">{hint}</span>
            </span>
            <span className="assign-task-drop__pill">Browse</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
      {error && <small className="text-[13px] text-red-600">{error}</small>}
    </div>
  )
}
