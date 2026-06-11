// src/components/ui/FormSelect.tsx

"use client"

import { Select } from "./Select"

type Option = {
  value: string
  label: string
}

interface Props {
  value?: string
  onChange?: (value: string) => void
  options?: Option[]
  children?: React.ReactNode
  disabled?: boolean
}

export function FormSelect({
  options,
  children,
  onChange,
  disabled = false,
  ...props
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value

    if (onChange) {
      onChange(value)
    }
  }

  return (
    <Select
      {...props}
      onChange={handleChange}
      disabled={disabled}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}

      {children}
    </Select>
  )
}