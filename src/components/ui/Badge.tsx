// src/components/ui/Badge.tsx

interface BadgeProps {
  text: string
  variant?: "success" | "warning" | "danger" | "neutral"
}

export function Badge({ text, variant = "neutral" }: BadgeProps) {
  const variants = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    neutral: "bg-[#f5f5f5] text-neutral-700 border border-[#d9d9d9]",
  }

  return (
    <span
      className={`inline-flex rounded-xl px-3 py-1 text-xs font-semibold ${variants[variant]}`}
    >
      {text}
    </span>
  )
}