// src/components/ui/Button.tsx

"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "danger"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  children,
  variant = "primary",
  fullWidth,
  loading,
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#002198]/15"

  const variants = {
    primary:
      "bg-[#002198] text-white shadow-[0_10px_24px_rgba(0,33,152,0.16)] hover:bg-[#00166f]",

    secondary:
      "border border-[#dfe7f7] bg-white text-black shadow-[0_6px_18px_rgba(15,23,42,0.035)] hover:border-[#cbd8f3] hover:bg-[#f8fbff]",

    danger:
      "bg-rose-600 text-white shadow-[0_10px_24px_rgba(225,29,72,0.16)] hover:bg-rose-700",
  }

  const sizes = "px-4 py-2.5"

  return (
    <button
      className={[
        base,
        variants[variant],
        sizes,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Carregando..." : children}
    </button>
  )
}