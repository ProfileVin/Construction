interface SidebarLogoProps {
  compact?: boolean
}

/** Placeholder brand mark from the sidebar mockup — swap for the real logo when it exists. */
export function SidebarLogo({ compact = false }: SidebarLogoProps) {
  return (
    <span className="inline-flex items-center gap-3" role="img" aria-label="Logo">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand">
        <span className="h-5 w-5 rounded-sm bg-white" />
      </span>
      {!compact && (
        <span className="text-3xl font-semibold tracking-[0.2em] text-slate-900">LOGO</span>
      )}
    </span>
  )
}
