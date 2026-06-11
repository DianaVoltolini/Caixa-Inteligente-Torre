// src/components/ui/StrategicBlock.tsx

import { ReactNode } from "react"

interface StrategicBlockProps {
  title: string
  children: ReactNode
}

export function StrategicBlock({
  title,
  children,
}: StrategicBlockProps) {
  return (
    <div className="
      rounded-2xl
      border border-[#cfd8ff]
      bg-[#eeeeee]
      p-6 space-y-3
    ">

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {title}
      </p>

      <div className="text-sm text-[#002198]">
        {children}
      </div>

    </div>
  )
}