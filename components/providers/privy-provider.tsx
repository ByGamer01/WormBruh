"use client"

import type React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { privyConfig } from "@/lib/privy-config"

interface PrivyProviderWrapperProps {
  children: React.ReactNode
}

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmf8haz92005tl80bsg0fikx8"

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      {children}
    </PrivyProvider>
  )
}
