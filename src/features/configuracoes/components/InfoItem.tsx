// src/features/configuracoes/components/InfoItem.tsx

"use client"

export default function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-[#e8eefc] py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#002198]">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-black">
        {value}
      </span>
    </div>
  )
}