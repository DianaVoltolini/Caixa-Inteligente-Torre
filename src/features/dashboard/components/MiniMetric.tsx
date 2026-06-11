// src/features/dashboard/components/MiniMetric.tsx

"use client"

import { Card } from "@/components/ui/Card"

type MiniMetricTone = "default" | "primary" | "success" | "danger"

type MiniMetricProps = {
  label: string
  value: string
  tone?: MiniMetricTone
}

export function MiniMetric({
  label,
  value,
  tone = "default",
}: MiniMetricProps) {
  const valueTone =
    tone === "primary"
      ? "text-[#002198]"
      : tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
      ? "text-rose-600"
      : "text-black"

  return (
    <Card variant="soft" className="p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>

      <p className={`mt-1.5 text-base font-semibold ${valueTone}`}>
        {value}
      </p>
    </Card>
  )
}