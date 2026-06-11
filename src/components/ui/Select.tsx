// src/components/ui/Select.tsx

"use client"

import React from "react"

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-[#d9d9d9] bg-white px-3 py-2.5 text-sm text-black outline-none transition",
        "focus:border-[#bfd0fb] focus:ring-0",
        "disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-neutral-500",
        props.className || "",
      ].join(" ")}
    />
  )
}