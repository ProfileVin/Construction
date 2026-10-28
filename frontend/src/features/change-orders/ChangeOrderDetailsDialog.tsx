import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { openBlobInNewTab } from '../../lib/download'
import { formatCurrency, formatFileSize } from '../../lib/format'
import { fetchDocumentContent, type DocumentFormat } from '../documents/documents.api'
import type { ChangeOrder, ChangeOrderDecision } from './changeOrders.api'
import { useChangeOrder, useDecideChangeOrder } from './changeOrders.hooks'
import { ChangeOrderStatusBadge } from './ChangeOrderStatusBadge'

type StepState = 'approved' | 'rejected' | 'active' | 'waiting' | 'skipped'

interface ApprovalStep {
  title: string
  state: StepState
  byName: string | null
  at: string | null
}

/** Derives the two-step timeline (ADR-0027) from the change order's own fields. */
function approvalSteps(co: ChangeOrder): ApprovalStep[] {
  const rejectedByContractor = co.status === 'Rejected' && co.ownerDecidedByName === null
  const contractor: StepState =
    co.status === 'Pending' ? 'active' : rejectedByContractor ? 'rejected' : 'approved'
  const owner: StepState =
    co.status === 'Approved'
      ? 'approved'
      : co.status === 'PendingOwnerApproval'
        ? 'active'
        : co.status === 'Pending'
          ? 'waiting'
          : rejectedByContractor
            ? 'skipped'
            : 'rejected'

  return [
    { title: 'General Contractor Review', state: contractor, byName: co.contractorReviewedByName, at: co.contractorReviewedAt },
    {
      title: 'Owner Sign-Off',
      state: owner,
      byName: co.ownerDecidedByName,
      at: owner === 'approved' || owner === 'rejected' ? co.decidedAt : null,
    },
  ]
}

const STEP_LABEL: Record<StepState, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Pending',
  waiting: 'Not started',
  skipped: 'Not required',
}

const STEP_STYLE: Record<StepState, { icon: string; dot: string; text: string }> = {
  approved: { icon: 'pi-check', dot: 'bg-brand text-white', text: 'text-brand' },
  rejected: { icon: 'pi-times', dot: 'bg-red-600 text-white', text: 'text-red-600' },
  active: { icon: 'pi-hourglass', dot: 'bg-brand text-white', text: 'text-brand' },
  waiting: { icon: 'pi-circle', dot: 'bg-slate-200 text-slate-500', text: 'text-slate-500' },
  skipped: { icon: 'pi-minus', dot: 'bg-slate-200 text-slate-500', text: 'text-slate-500' },
}

const FORMAT_ICON: Record<DocumentFormat, string> = {
  Image: 'pi-image',
  Pdf: 'pi-file-pdf',
  Word: 'pi-file-word',
  Spreadsheet: 'pi-file-excel',
  Other: 'pi-file',
}

interface ChangeOrderDetailsDialogProps {
  projectId: string
  changeOrder: ChangeOrder | null
  currencyCode: string
  onHide: () => void
  /** Called with the updated change order, so the dialog can show the new status. */
  onDecided: (changeOrder: ChangeOrder) => void
}

export function ChangeOrderDetailsDialog({
  projectId,
  changeOrder: row,
  currencyCode,
  onHide,
  onDecided,
}: ChangeOrderDetailsDialogProps) {
  const decide = useDecideChangeOrder(projectId)
  // List rows carry no attachments; the detail read adds them (and the freshest status).
  const { data: detail } = useChangeOrder(projectId, row?.id)
  const changeOrder = detail && detail.id === row?.id ? detail : row
  const [attachmentError, setAttachmentError] = useState(false)

  const close = () => {
    if (decide.isPending) return
    decide.reset()
    setAttachmentError(false)
    onHide()
  }

  const submit = async (decision: ChangeOrderDecision) => {
    if (!changeOrder) return
    try {
      onDecided(await decide.mutateAsync({ changeOrderId: changeOrder.id, decision }))
    } catch {
      // Shown below via decide.isError.
    }
  }

  const openAttachment = async (documentId: string) => {
    setAttachmentError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(projectId, documentId, false))
    } catch {
      setAttachmentError(true)
    }
  }

  const pendingDecision = decide.isPending ? decide.variables?.decision : undefined
  const steps = changeOrder ? approvalSteps(changeOrder) : []
  const completed = steps.filter((s) => s.state === 'approved').length
  const cardClass = 'flex min-w-0 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4'

  return (
    <Dialog
      header={
        changeOrder && (
          <div className="flex flex-col items-start gap-2 pr-2">
            <span className="wrap-break-word">
              Change Order {changeOrder.coNumber} — {changeOrder.description}
            </span>
            <ChangeOrderStatusBadge status={changeOrder.status} className="text-sm" />
          </div>
        )
      }
      visible={row !== null}
      onHide={close}
      modal
      dismissableMask={!decide.isPending}
      closable={!decide.isPending}
      draggable={false}
      style={{ width: '46rem' }}
      breakpoints={{ '768px': '95vw' }}
      className="form-dialog"
    >
      {changeOrder && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={cardClass}>
              <span className="text-sm font-medium text-slate-600">Total Cost</span>
              <span className="wrap-break-word text-2xl font-bold text-brand">
                {formatCurrency(changeOrder.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {changeOrder.categoryName && <span className="text-xs text-slate-500">{changeOrder.categoryName}</span>}
            </div>
            <div className={cardClass}>
              <span className="text-sm font-medium text-slate-600">Schedule Impact</span>
              {changeOrder.scheduleImpactDays > 0 ? (
                <span className="text-2xl font-bold text-red-600">
                  +{changeOrder.scheduleImpactDays} {changeOrder.scheduleImpactDays === 1 ? 'Day' : 'Days'}
                </span>
              ) : (
                <span className="text-2xl font-bold text-slate-700">No impact</span>
              )}
              {changeOrder.reason && <span className="text-xs text-slate-500">{changeOrder.reason}</span>}
            </div>
            <div className={cardClass}>
              <span className="text-sm font-medium text-slate-600">Requested By</span>
              {changeOrder.requestedByName && (
                <span className="wrap-break-word text-xl font-bold text-brand-ink">{changeOrder.requestedByName}</span>
              )}
              <span className="text-sm text-slate-600">{dayjs(changeOrder.requestedDate).format('MMM D, YYYY')}</span>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Summary &amp; Scope</h3>
            {changeOrder.scope ? (
              <p className="mt-2 whitespace-pre-wrap wrap-break-word text-[15px] leading-relaxed text-slate-700">
                {changeOrder.scope}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-slate-500">No scope provided.</p>
            )}
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-xs font-semibold text-slate-700">Attachments</p>
              {changeOrder.attachments.length === 0 ? (
                <p className="mt-2 text-sm italic text-slate-500">No attachments.</p>
              ) : (
                <ul className="mt-2 flex flex-col items-start gap-2">
                  {changeOrder.attachments.map((a) => (
                    <li key={a.documentId} className="max-w-full">
                      <button
                        type="button"
                        onClick={() => openAttachment(a.documentId)}
                        className="flex max-w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm hover:bg-blue-100"
                      >
                        <i className={`pi ${FORMAT_ICON[a.format]} text-slate-600`} aria-hidden />
                        <span className="truncate font-semibold text-slate-900">{a.fileName}</span>
                        <span className="shrink-0 text-xs text-slate-500">({formatFileSize(a.sizeBytes)})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {attachmentError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  Couldn’t open the attachment. Please try again.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <i className="pi pi-check-circle text-brand" aria-hidden />
                Approval Status
              </h3>
              <span className="text-xs font-semibold text-slate-600">{completed} of 2 Complete</span>
            </div>

            <ol className="mt-3 flex flex-col gap-3">
              {steps.map((step) => {
                const style = STEP_STYLE[step.state]
                const meta = [step.byName, step.at && dayjs(step.at).format('MMM D')].filter(Boolean).join(' • ')
                return (
                  <li key={step.title} className="flex items-start gap-3">
                    <span
                      className={`mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.dot}`}
                      aria-hidden
                    >
                      <i className={`pi ${style.icon} text-xs`} />
                    </span>
                    <div
                      className={`flex min-w-0 flex-1 flex-col gap-3 rounded-lg px-3 py-2 ${
                        step.state === 'active' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{step.title}</p>
                          {meta && <p className="text-xs text-slate-600">{meta}</p>}
                        </div>
                        <span className={`shrink-0 text-xs font-semibold ${style.text}`}>{STEP_LABEL[step.state]}</span>
                      </div>

                      {step.state === 'active' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Button
                            type="button"
                            label="Reject"
                            outlined
                            size="small"
                            onClick={() => submit('reject')}
                            loading={pendingDecision === 'reject'}
                            disabled={decide.isPending}
                          />
                          <Button
                            type="button"
                            label={changeOrder.status === 'Pending' ? 'Approve Review' : 'Approve Sign-Off'}
                            size="small"
                            onClick={() => submit('approve')}
                            loading={pendingDecision === 'approve'}
                            disabled={decide.isPending}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          {decide.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Couldn’t update {changeOrder.coNumber}. Please try again.
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
