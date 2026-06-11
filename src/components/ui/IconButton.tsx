// src/components/ui/IconButton.tsx

"use client"

import React from "react"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger"
}

export function IconButton({
  variant = "default",
  className = "",
  ...props
}: Props) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"

  const variants = {
    default: `
      border border-[#d9d9d9]
      bg-[#f5f5f5]
      text-black
      hover:bg-[#eeeeee]
    `,
    danger: `
      border border-rose-200
      bg-rose-50
      text-rose-600
      hover:bg-rose-100
    `,
  }

  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {props.children}
    </button>
  )
}