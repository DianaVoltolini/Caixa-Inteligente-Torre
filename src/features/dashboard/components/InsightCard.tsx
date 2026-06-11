// src/features/dashboard/components/InsightCard.tsx

"use client"

import { Card } from "@/components/ui/Card"

export function InsightCard({
  eyebrow,
  title,
  description,
  children,
}: any) {
  return (
    <Card className="p-6 md:p-8">
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
          {eyebrow}
        </p>

        <h2 className="text-xl font-semibold text-black">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-neutral-600">
            {description}
          </p>
        )}

        {children}
      </div>
    </Card>
  )
}