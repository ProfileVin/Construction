import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { DocumentsTable } from './DocumentsTable'
import { UploadDocumentDialog } from './UploadDocumentDialog'
import { useDocumentCounts, useDocuments } from './documents.hooks'
import type { DocumentFilters, DocumentFormat } from './documents.api'

const PAGE_SIZE = 8

const FORMAT_TABS: { label: string; value: DocumentFormat | null }[] = [
  { label: 'All Files', value: null },
  { label: 'Images', value: 'Image' },
  { label: 'Spreadsheet Document', value: 'Spreadsheet' },
  { label: 'Word Document', value: 'Word' },
  { label: 'PDF Document', value: 'Pdf' },
]

interface DocumentsPanelProps {
  projectId: string
}

export function DocumentsPanel({ projectId }: DocumentsPanelProps) {
  const [uploadVisible, setUploadVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [format, setFormat] = useState<DocumentFormat | null>(null)
  const [page, setPage] = useState(1)

  const filters: DocumentFilters = {
    search: search || undefined,
    format: format ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = useDocuments(projectId, filters)
  const { data: counts } = useDocumentCounts(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Project File Repository</h1>
          <p className="mt-1 text-sm text-slate-600">
            Official drawings, legal permits, subcontracts, and inspection logs
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <span className="flat-search flex min-w-[220px] flex-1 items-center gap-2 lg:w-96 lg:flex-none">
            <i className="pi pi-search text-slate-500" aria-hidden />
            <InputText
              value={search}
              onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              placeholder="Search within documents..."
              aria-label="Search within documents"
              className="w-full"
            />
          </span>
          <Button label="Upload Document" icon="pi pi-cloud-upload" onClick={() => setUploadVisible(true)} />
        </div>
      </div>

      <div role="tablist" aria-label="Filter by format" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FORMAT_TABS.map((tab) => {
          const active = format === tab.value
          const label = tab.value === null && counts ? `${tab.label} (${counts.all})` : tab.label
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => resetToFirstPage(setFormat)(tab.value)}
              className={`shrink-0 rounded-lg px-5 py-2.5 text-[15px] font-semibold transition-colors ${
                active ? 'bg-brand text-white' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <DocumentsTable
        projectId={projectId}
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <UploadDocumentDialog projectId={projectId} visible={uploadVisible} onHide={() => setUploadVisible(false)} />
    </div>
  )
}
