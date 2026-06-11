// src/components/layout/PageHeader.tsx

"use client"

import { ReactNode } from "react"

type Props = {
  title: string
  subtitle?: string
  action?: ReactNode
  actions?: ReactNode
  eyebrow?: string
}

export default function PageHeader({
  title,
  subtitle,
  action,
  actions,
  eyebrow = "Visão geral",
}: Props) {
  const headerAction = actions ?? action

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-black md:text-[32px]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {headerAction ? (
        <div className="flex shrink-0 items-center gap-2 lg:pt-1">
          {headerAction}
        </div>
      ) : null}
    </div>
  )
}