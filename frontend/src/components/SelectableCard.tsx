interface SelectableCardProps {
  title: string
  description?: string | null
  selected: boolean
  onSelect: () => void
}

export function SelectableCard({ title, description, selected, onSelect }: SelectableCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="select-card"
      data-selected={selected}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-[15px] font-semibold text-slate-800">{title}</span>
        <span className="select-card__radio" aria-hidden="true">
          {selected && <span className="select-card__dot" />}
        </span>
      </span>
      {description && (
        <span className="mt-2 block text-[13px] leading-relaxed text-slate-500">{description}</span>
      )}
    </button>
  )
}
