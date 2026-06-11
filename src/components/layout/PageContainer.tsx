// src/components/layout/PageContainer.tsx

"use client"

import { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export default function PageContainer({ children }: Props) {
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
        {children}
      </div>
    </div>
  )
}