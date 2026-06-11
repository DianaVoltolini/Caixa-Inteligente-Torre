// src/components/ui/AlertBanner.tsx

"use client"

interface Props {
  children: React.ReactNode
}

export function AlertBanner({ children }: Props) {
  return (
    <div className="mb-6 w-full">
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {children}
      </div>
    </div>
  )
}