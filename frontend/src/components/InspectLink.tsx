interface InspectLinkProps {
  onClick: () => void
  /** What is being inspected, for screen readers — e.g. "CO-0048". */
  subject: string
}

/** The "Inspect >" row action on the Change Order and Invoice tables. */
export function InspectLink({ onClick, subject }: InspectLinkProps) {
  return (
    <button type="button" onClick={onClick} aria-label={`Inspect ${subject}`} className="inspect-link">
      Inspect
      <i className="pi pi-angle-right" aria-hidden />
    </button>
  )
}
