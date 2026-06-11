// src/app/layout.tsx

import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Caixa Inteligente",
  description: "Gestão financeira simples e inteligente",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}