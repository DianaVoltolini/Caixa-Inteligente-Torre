// src/components/ui/FormInput.tsx

"use client"

import { Input } from "./Input"

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}

export function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <Input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      disabled={disabled}
    />
  )
}