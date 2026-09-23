import { api } from '../../lib/api'

export type DocumentFormat = 'Image' | 'Pdf' | 'Word' | 'Spreadsheet' | 'Other'

export interface ProjectDocument {
  id: string
  projectId: string
  phaseId: string | null
  phaseName: string | null
  name: string
  originalFileName: string
  contentType: string
  sizeBytes: number
  format: DocumentFormat
  uploadedByName: string
  createdAt: string
  updatedAt: string
}

export interface PagedDocuments {
  items: ProjectDocument[]
  totalCount: number
  page: number
  pageSize: number
}

export interface DocumentCounts {
  all: number
  image: number
  pdf: number
  word: number
  spreadsheet: number
  other: number
}

export interface DocumentFilters {
  search?: string
  format?: DocumentFormat
  page: number
  pageSize: number
}

export interface UploadDocumentPayload {
  file: File
  name?: string
  phaseId?: string | null
  onProgress?: (percent: number) => void
}

export async function searchDocuments(projectId: string, filters: DocumentFilters): Promise<PagedDocuments> {
  const { data } = await api.get<PagedDocuments>(`/projects/${projectId}/documents`, { params: filters })
  return data
}

export async function getDocumentCounts(projectId: string): Promise<DocumentCounts> {
  const { data } = await api.get<DocumentCounts>(`/projects/${projectId}/documents/counts`)
  return data
}

export async function uploadDocument(projectId: string, payload: UploadDocumentPayload): Promise<ProjectDocument> {
  const form = new FormData()
  form.append('file', payload.file)
  if (payload.name) form.append('name', payload.name)
  if (payload.phaseId) form.append('phaseId', payload.phaseId)

  // The shared client defaults to JSON, which would make axios serialize the FormData — override it.
  const { data } = await api.post<ProjectDocument>(`/projects/${projectId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total) payload.onProgress?.(Math.round((e.loaded / e.total) * 100))
    },
  })
  return data
}

/** Fetched as a blob because the endpoint needs the bearer header — a plain `<a href>` can't send it. */
export async function fetchDocumentContent(projectId: string, documentId: string, download: boolean): Promise<Blob> {
  const { data } = await api.get<Blob>(`/projects/${projectId}/documents/${documentId}/content`, {
    params: { download },
    responseType: 'blob',
  })
  return data
}
