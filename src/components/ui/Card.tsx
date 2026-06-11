// src/components/ui/Card.tsx

"use client"

import { ReactNode } from "react"

type Variant = "default" | "soft" | "outlined"

interface Props {
  children: ReactNode
  className?: string
  variant?: Variant
}

export function Card({
  children,
  className = "",
  variant = "default",
}: Props) {
  const base =
    "rounded-[28px] transition-all duration-200"

  const variants = {
    default:
      "border border-[#dfe7f7] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.045)]",

    soft:
      "border border-[#dfe7f7] bg-[#f8fbff] shadow-[0_12px_30px_rgba(15,23,42,0.035)]",

    outlined:
      "border border-[#dfe7f7] bg-white shadow-none",
  }

  return (
    <div className={[base, variants[variant], className].join(" ")}>
      {children}
    </div>
  )
}