// src/components/ui/SectionGrid.tsx

import { ReactNode } from "react"

interface SectionGridProps {
  columns?: 2 | 3 | 4 | 5
  children: ReactNode
}

export function SectionGrid({
  columns = 2,
  children,
}: SectionGridProps) {

  const colMap = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  }

  return (
    <div className={`grid gap-6 ${colMap[columns]}`}>
      {children}
    </div>
  )
}