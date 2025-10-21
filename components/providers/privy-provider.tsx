"use client"

import type React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { privyConfig } from "@/lib/privy-config"

interface PrivyProviderWrapperProps {
  children: React.ReactNode
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId="cmf8haz92005tl80bsg0fikx8"
      config={privyConfig}
      onSuccess={(user) => {
        console.log("[v0] Usuario autenticado exitosamente:", user.id)
      }}
      onError={(error) => {
        console.error("[v0] Error de autenticación:", error)
        if (error.message && typeof error.message === "string") {
          console.error("[v0] Mensaje de error:", error.message)
        }
      }}
    >
      {children}
    </PrivyProvider>
  )
}
