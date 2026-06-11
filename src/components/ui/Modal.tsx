// src/components/ui/Modal.tsx

"use client"

import { ReactNode, useEffect } from "react"
import { ModalPortal } from "./ModalPortal"

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
        <div className="w-full max-w-lg rounded-[28px] border border-[#d9d9d9] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-black">
              {title}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-600 transition hover:text-black"
            >
              ✕
            </button>
          </div>

          {children}
        </div>
      </div>
    </ModalPortal>
  )
}