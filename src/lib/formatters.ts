export function formatCurrency(value?: number | null) {

  const numero = Number(value ?? 0)

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })

}
