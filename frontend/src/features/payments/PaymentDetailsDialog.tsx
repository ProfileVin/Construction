import dayjs from 'dayjs'
import { Dialog } from 'primereact/dialog'
import { formatCurrency } from '../../lib/format'
import type { Payment } from './payments.api'
import { directionOptions, METHOD_LABELS } from './payments.schema'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface PaymentDetailsDialogProps {
  payment: Payment | null
  currencyCode: string
  onHide: () => void
}

export function PaymentDetailsDialog({ payment, currencyCode, onHide }: PaymentDetailsDialogProps) {
  const rows = payment
    ? [
        { label: 'Payment Type', value: directionOptions.find((o) => o.value === payment.direction)?.label },
        { label: 'Client/Payee', value: payment.partyName },
        { label: 'Payment Method', value: METHOD_LABELS[payment.method] },
        { label: 'Payment Date', value: dayjs(payment.paymentDate).format('MMM D, YYYY') },
      ]
    : []

  return (
    <Dialog
      header={payment ? `Payment ${payment.paymentNumber}` : 'Payment'}
      visible={payment !== null}
      onHide={onHide}
      modal
      dismissableMask
      draggable={false}
      style={{ width: '34rem' }}
      className="form-dialog mx-4"
    >
      {payment && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-2xl font-bold text-brand">
              {formatCurrency(payment.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <PaymentStatusBadge status={payment.status} />
          </div>

          <dl className="log-info-box grid grid-cols-1 gap-3 px-4 py-3 text-sm sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                <dd className="mt-0.5 break-words text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>

          {payment.notes && (
            <div>
              <p className="text-[14px] font-medium text-slate-900">Note</p>
              <p className="log-info-box mt-1.5 whitespace-pre-wrap px-4 py-3 text-sm text-slate-700">{payment.notes}</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
