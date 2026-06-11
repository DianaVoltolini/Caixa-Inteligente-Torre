// src/features/configuracoes/components/PerfilCard.tsx

"use client"

type PerfilCardProps = {
  title: string
  description?: string
  badge?: string
  actionLabel?: string
  onAction?: () => void
  children: React.ReactNode
  gridClassName?: string
}

export default function PerfilCard({
  title,
  description,
  badge,
  actionLabel,
  onAction,
  children,
  gridClassName,
}: PerfilCardProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[#dfe7f7] bg-white shadow-[0_22px_55px_rgba(15,23,42,0.07)]">
      <div className="flex flex-col gap-4 border-b border-[#e8eefc] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eef3ff_100%)] px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            Bloco da conta
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-black">
              {title}
            </h2>

            {badge && (
              <span className="inline-flex items-center rounded-full border border-[#dfe7f7] bg-[#eef3ff] px-2.5 py-1 text-[11px] font-semibold text-[#002198]">
                {badge}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {description}
            </p>
          )}
        </div>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full sm:w-auto rounded-2xl border border-[#dfe7f7] bg-white px-4 py-2.5 text-sm font-semibold text-[#002198] transition hover:bg-[#f8fbff]"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        <div className={gridClassName || "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
          {children}
        </div>
      </div>
    </section>
  )
}