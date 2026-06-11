// src/components/ui/FormCheckbox.tsx

"use client"

interface Props {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function FormCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked)
  }

  return (
    <label className="flex items-center gap-2 text-sm text-black">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 rounded border border-[#d9d9d9]"
      />

      <span className={disabled ? "text-neutral-400" : ""}>
        {label}
      </span>
    </label>
  )
}