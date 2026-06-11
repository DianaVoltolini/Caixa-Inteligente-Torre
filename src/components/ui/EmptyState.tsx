// src/components/ui/EmptyState.tsx

interface Props {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="space-y-5 py-12 text-center">
      <div className="space-y-2">
        <p className="text-base font-semibold text-black">
          {title}
        </p>

        <p className="text-sm text-neutral-600">
          {description}
        </p>
      </div>

      {action && <div>{action}</div>}

      <p className="text-xs text-neutral-600">
        Começar é o que vai te mostrar o que realmente sobra no final do mês.
      </p>
    </div>
  )
}