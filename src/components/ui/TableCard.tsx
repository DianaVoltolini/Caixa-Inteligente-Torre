// src/components/ui/TableCard.tsx

"use client"

import { ReactNode } from "react"
import { Card } from "./Card"

type TableCardProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function TableCard({
  title,
  description,
  children,
  className = "",
}: TableCardProps) {
  return (
    <Card
      className={[
        "overflow-hidden rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
        className,
      ].join(" ")}
    >
      <div className="border-b border-[#e8eefc] bg-[#f8fbff] px-4 py-3">
        <p className="text-sm font-medium text-black">
          {title}
        </p>

        {description ? (
          <p className="mt-1 text-xs text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </Card>
  )
}