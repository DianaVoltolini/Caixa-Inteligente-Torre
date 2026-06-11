// src/features/torre-controle/components/MasterUserStatusBadge.tsx

"use client"

type Props = {
  status: string | null
}

function getStatusConfig(status: string | null) {
  switch (status) {
    case "ativo":
      return {
        label: "Ativo",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      }

    case "inativo":
      return {
        label: "Inativo",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      }

    default:
      return {
        label: status || "Sem status",
        className: "border-neutral-200 bg-neutral-50 text-neutral-700",
      }
  }
}

export default function MasterUserStatusBadge({ status }: Props) {
  const config = getStatusConfig(status)

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  )
}