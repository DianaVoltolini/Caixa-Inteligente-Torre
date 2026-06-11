// src/components/ui/KPI.tsx

"use client"

import { ReactNode } from "react"

interface KPIProps {
  label: string
  value: string
  subtitle?: string
  color?: string
  action?: ReactNode
}

export function KPI({
  label,
  value,
  subtitle,
  color = "text-black",
  action,
}: KPIProps) {
  return (
    <div className="relative flex min-h-[72px] flex-col justify-between">
      {action && (
        <div className="absolute right-0 top-0">
          {action}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-600">
          {label}
        </p>

        <p className={`text-2xl font-semibold tracking-tight ${color}`}>
          {value}
        </p>
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-neutral-600">
          {subtitle}
        </p>
      )}
    </div>
  )
}