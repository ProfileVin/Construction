import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useState } from 'react'
import { pagerTemplate } from '../../components/pagerTemplate'
import { downloadBlob, openBlobInNewTab } from '../../lib/download'
import { formatFileSize } from '../../lib/format'
import { fetchDocumentContent, type DocumentFormat, type PagedDocuments, type ProjectDocument } from './documents.api'

const FORMAT_LABELS: Record<DocumentFormat, string> = {
  Image: 'Image',
  Pdf: 'PDF',
  Word: 'Doc',
  Spreadsheet: 'Sheet',
  Other: 'File',
}

interface DocumentsTableProps {
  projectId: string
  data: PagedDocuments | undefined
  isLoading: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function DocumentsTable({ projectId, data, isLoading, page, pageSize, onPageChange }: DocumentsTableProps) {
  const [actionError, setActionError] = useState<string | null>(null)

  const openDocument = async (doc: ProjectDocument) => {
    setActionError(null)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(projectId, doc.id, false))
    } catch {
      setActionError(`Couldn't open "${doc.name}". Please try again.`)
    }
  }

  const downloadDocument = async (doc: ProjectDocument) => {
    setActionError(null)
    try {
      downloadBlob(await fetchDocumentContent(projectId, doc.id, true), doc.originalFileName)
    } catch {
      setActionError(`Couldn't download "${doc.name}". Please try again.`)
    }
  }

  return (
    <div className="mt-4">
      {actionError && (
        <div role="alert" className="mb-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-x-auto">
        <DataTable
          value={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No documents found."
          className="app-table min-w-[860px]"
          paginator
          lazy
          rows={pageSize}
          first={(page - 1) * pageSize}
          totalRecords={data?.totalCount ?? 0}
          onPage={(e) => onPageChange(Math.floor((e.first ?? 0) / pageSize) + 1)}
          paginatorTemplate={pagerTemplate}
        >
          <Column
            header="S.No"
            body={(_row: ProjectDocument, opts) => opts.rowIndex + 1} // rowIndex already includes the page offset (BUG-006)
            style={{ width: '5rem' }}
            bodyClassName="text-center"
            headerClassName="app-table__center"
          />
          <Column
            header="File Name"
            body={(row: ProjectDocument) => (
              <div className="flex max-w-[26rem] flex-col gap-1">
                <span className="truncate text-[15px] text-slate-800" title={row.name}>
                  {row.name}
                </span>
                <span className="truncate text-xs text-slate-500" title={row.originalFileName}>
                  {row.phaseName ? `${row.phaseName} Phase` : row.originalFileName}
                </span>
              </div>
            )}
          />
          <Column header="Uploaded by" body={(row: ProjectDocument) => row.uploadedByName} />
          <Column header="Last Modified" body={(row: ProjectDocument) => dayjs(row.updatedAt).format('DD/MM/YYYY')} />
          <Column header="File Size" body={(row: ProjectDocument) => formatFileSize(row.sizeBytes)} />
          <Column
            header="Format"
            body={(row: ProjectDocument) => (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {FORMAT_LABELS[row.format]}
              </span>
            )}
          />
          <Column
            header="Action"
            body={(row: ProjectDocument) => (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => openDocument(row)}
                  className="text-[15px] font-semibold text-sky-900 hover:underline"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => downloadDocument(row)}
                  aria-label={`Download ${row.name}`}
                  title="Download"
                  className="text-slate-600 hover:text-brand"
                >
                  <i className="pi pi-download" aria-hidden />
                </button>
              </div>
            )}
          />
        </DataTable>
      </div>
    </div>
  )
}
