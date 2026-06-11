// src/lib/masks.ts


/* =====================================================
   WHATSAPP
===================================================== */

export function maskWhatsapp(value: string) {

  const numbers = value.replace(/\D/g, "").slice(0, 11)

  if (numbers.length <= 10) {

    return numbers.replace(
      /(\d{2})(\d{4})(\d{0,4})/,
      "($1) $2-$3"
    )

  }

  return numbers.replace(
    /(\d{2})(\d{5})(\d{0,4})/,
    "($1) $2-$3"
  )

}


export function openWhatsApp(phone: string) {

  if (!phone) return

  const numbers = phone.replace(/\D/g, "")

  const url = `https://wa.me/55${numbers}`

  window.open(url, "_blank")

}



/* =====================================================
   MOEDA (INPUT)
   Ex: 390 → 3,90
===================================================== */

export function maskCurrencyInput(value: string) {

  const numbers = value.replace(/\D/g, "")

  const cents = Number(numbers) / 100

  if (isNaN(cents)) return ""

  return cents
    .toFixed(2)
    .replace(".", ",")

}



/* =====================================================
   MOEDA (DISPLAY)
===================================================== */

export function formatCurrency(value: number | string) {

  const number =
    typeof value === "string"
      ? Number(value)
      : value

  if (isNaN(number)) return "R$ 0,00"

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

}



/* =====================================================
   CPF / CNPJ
===================================================== */

export function maskCpfCnpj(value: string) {

  const numbers = value.replace(/\D/g, "").slice(0, 14)

  if (numbers.length <= 11) {

    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")

  }

  return numbers
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")

}



/* =====================================================
   CEP
===================================================== */

export function maskCep(value: string) {

  const numbers = value.replace(/\D/g, "").slice(0, 8)

  if (numbers.length <= 5) return numbers

  return numbers.replace(
    /(\d{5})(\d+)/,
    "$1-$2"
  )

}