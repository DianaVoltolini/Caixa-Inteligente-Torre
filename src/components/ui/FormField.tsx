// src/components/ui/FormField.tsx

"use client"

interface Props {
  label: string
  children: React.ReactNode
  error?: string | null
  required?: boolean
}

export function FormField({
  label,
  children,
  error,
  required = false,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}