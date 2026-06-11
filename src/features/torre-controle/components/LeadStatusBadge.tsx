// src/features/torre-controle/components/LeadStatusBadge.tsx

"use client"

type Props = {
  status: string | null
}

function getStatusConfig(status: string | null) {
  switch (status) {
    case "novo":
      return {
        label: "Novo",
        className:
          "border-[#dbe3f4] bg-[#f8fbff] text-[#002198]",
      }

    case "contatado":
      return {
        label: "Contatado",
        className:
          "border-amber-200 bg-amber-50 text-amber-800",
      }

    case "no_grupo":
      return {
        label: "No grupo",
        className:
          "border-sky-200 bg-sky-50 text-sky-800",
      }

    case "engajado":
      return {
        label: "Engajado",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
      }

    case "nao_respondeu":
      return {
        label: "Não respondeu",
        className:
          "border-rose-200 bg-rose-50 text-rose-700",
      }

    default:
      return {
        label: status || "Sem status",
        className:
          "border-neutral-200 bg-neutral-50 text-neutral-700",
      }
  }
}

export default function LeadStatusBadge({ status }: Props) {
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