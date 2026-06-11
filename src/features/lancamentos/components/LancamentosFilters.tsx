// src/features/lancamentos/components/LancamentosFilters.tsx

"use client"

type Props = {
  typeFilter: string
  onTypeChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

function getTabClass(isActive: boolean) {
  return isActive
    ? "rounded-full border border-[#dbe3f4] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#002198]"
    : "rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition hover:border-[#dbe3f4] hover:text-[#002198]"
}

export function LancamentosFilters({
  typeFilter,
  onTypeChange,
  search,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  return (
    <div className="rounded-[28px] border border-[#dfe7f7] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[#eef2f7] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onTypeChange("all")}
            className={getTabClass(typeFilter === "all")}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("income")}
            className={getTabClass(typeFilter === "income")}
          >
            Receitas
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("expense")}
            className={getTabClass(typeFilter === "expense")}
          >
            Despesas
          </button>
        </div>

        <div className="w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar lançamento..."
            className="w-full rounded-2xl border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-[#bfd0fb] focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">De</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-2xl border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-black focus:border-[#bfd0fb] focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-2xl border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-black focus:border-[#bfd0fb] focus:outline-none focus:ring-0"
          />
        </div>
      </div>
    </div>
  )
}