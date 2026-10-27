import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { formatCurrency } from '../../lib/format'
import type { ChangeOrder, ChangeOrderDecision } from './changeOrders.api'
import { useDecideChangeOrder } from './changeOrders.hooks'
import { ChangeOrderStatusBadge } from './ChangeOrderStatusBadge'

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
  changeOrder,
  currencyCode,
  onHide,
  onDecided,
}: ChangeOrderDetailsDialogProps) {
  const decide = useDecideChangeOrder(projectId)

  const close = () => {
    if (decide.isPending) return
    decide.reset()
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

  const pendingDecision = decide.isPending ? decide.variables?.decision : undefined

  return (
    <Dialog
      header={changeOrder ? `Change Order ${changeOrder.coNumber}` : 'Change Order'}
      visible={changeOrder !== null}
      onHide={close}
      modal
      dismissableMask={!decide.isPending}
      closable={!decide.isPending}
      draggable={false}
      style={{ width: '34rem' }}
      className="form-dialog mx-4"
    >
      {changeOrder && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[17px] font-semibold text-slate-900">{changeOrder.description}</p>
              <p className="mt-1 text-sm text-slate-500">
                Requested {dayjs(changeOrder.requestedDate).format('MMM D, YYYY')}
                {changeOrder.decidedAt &&
                  ` · ${changeOrder.status} ${dayjs(changeOrder.decidedAt).format('MMM D, YYYY')}`}
              </p>
            </div>
            <ChangeOrderStatusBadge status={changeOrder.status} />
          </div>

          <div className="flex items-baseline justify-between rounded-md bg-blue-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</span>
            <span className="text-lg font-bold text-brand">
              {formatCurrency(changeOrder.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {changeOrder.reason && (
            <div>
              <p className="text-[14px] font-medium text-slate-900">Reason / Notes</p>
              <p className="log-info-box mt-1.5 whitespace-pre-wrap px-4 py-3 text-sm text-slate-700">
                {changeOrder.reason}
              </p>
            </div>
          )}

          {decide.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Couldn’t update {changeOrder.coNumber}. Please try again.
            </div>
          )}

          {changeOrder.status === 'Pending' && (
            <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
              <Button
                type="button"
                label="Reject"
                outlined
                onClick={() => submit('reject')}
                loading={pendingDecision === 'reject'}
                disabled={decide.isPending}
              />
              <Button
                type="button"
                label="Approve"
                onClick={() => submit('approve')}
                loading={pendingDecision === 'approve'}
                disabled={decide.isPending}
              />
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
