import type { ReactNode } from 'react'

interface SplitLayoutProps {
  children: ReactNode
  heroImageUrl?: string
  headline: string
  subcopy: string
}

/**
 * Split-screen auth shell: a tinted marketing panel on the left (hidden below the
 * `lg` breakpoint) and the form content on the right. Below `lg` the form panel
 * fills the viewport and centres its content.
 */
export function SplitLayout({ children, heroImageUrl, headline, subcopy }: SplitLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-ink lg:block">
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-brand/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-brand-ink/20 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-white">
          <h2 className="text-4xl font-extrabold leading-tight xl:text-5xl">{headline}</h2>
          <p className="mt-3 max-w-md text-lg text-white/80">{subcopy}</p>
        </div>
      </aside>

      <main className="flex min-h-dvh items-center justify-center bg-page px-6 py-10 sm:px-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  )
}
