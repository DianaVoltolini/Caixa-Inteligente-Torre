// src/components/selectors/SearchSelect.tsx

"use client"

import { useState } from "react"

type Option = {
  id: string
  name: string
}

interface Props {
  label: string
  description?: string
  placeholder?: string
  options: Option[]
  value: string
  onChange: (id: string) => void
}

export default function SearchSelect({
  label,
  description,
  placeholder = "Buscar...",
  options,
  value,
  onChange
}: Props) {

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  )

  const selected = options.find((o) => o.id === value)

  return (

    <div className="space-y-1">

      <label className="text-sm text-slate-600">
        {label}
      </label>

      {description && (
        <p className="text-xs text-slate-400">
          {description}
        </p>
      )}

      <div className="relative">

        <input
          value={query || selected?.name || ""}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />

        {open && (

          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-sm max-h-60 overflow-y-auto">

            {filtered.length === 0 && (
              <div className="p-2 text-xs text-slate-400">
                Nenhum resultado
              </div>
            )}

            {filtered.map((o) => (

              <button
                key={o.id}
                type="button"
                onClick={() => {

                  onChange(o.id)
                  setQuery(o.name)
                  setOpen(false)

                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                {o.name}
              </button>

            ))}

          </div>

        )}

      </div>

    </div>

  )

}