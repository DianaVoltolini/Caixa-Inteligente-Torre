// src/components/ui/ModalPortal.tsx

"use client"

import { ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
  children: ReactNode
}

export function ModalPortal({ children }: Props) {

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    children,
    document.body
  )

}
