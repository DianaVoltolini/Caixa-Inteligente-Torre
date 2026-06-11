// src/components/ui/FormTextarea.tsx

"use client"

interface Props {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
}

export function FormTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
  disabled = false,
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={[
        "w-full resize-none rounded-2xl border border-[#d9d9d9] bg-white px-3 py-2.5 text-sm text-black outline-none transition",
        "placeholder:text-neutral-400",
        "focus:border-[#bfd0fb] focus:ring-0",
        "disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-neutral-500",
      ].join(" ")}
    />
  )
}