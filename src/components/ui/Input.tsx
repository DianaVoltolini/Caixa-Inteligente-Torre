// src/components/ui/Input.tsx

"use client"

import React from "react"

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "w-full rounded-2xl border border-[#dfe7f7] bg-white px-3 py-2.5 text-sm text-black outline-none transition-all duration-200",
        "placeholder:text-neutral-400",
        "focus:border-[#002198] focus:ring-2 focus:ring-[#002198]/10",
        "disabled:cursor-not-allowed disabled:bg-[#f8fbff] disabled:text-neutral-500",
        className,
      ].join(" ")}
    />
  )
})