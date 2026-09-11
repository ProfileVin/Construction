interface ComingSoonPageProps {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 text-center shadow-sm">
      <i className="pi pi-hammer text-3xl text-brand" />
      <h1 className="text-xl font-bold text-brand-ink">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">{title} is coming soon.</p>
    </div>
  )
}
