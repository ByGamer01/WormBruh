"use client"

import { useWallets } from "@privy-io/react-auth"
import { createViemWalletClient } from "@/lib/viem-config"
import { useMemo } from "react"

export function useWalletClient() {
  const { wallets } = useWallets()

  const walletClient = useMemo(() => {
    if (!wallets.length) return null

    const wallet = wallets[0]
    if (!wallet) return null

    try {
      const ethereumProvider = wallet.getEthereumProvider()
      return createViemWalletClient(ethereumProvider)
    } catch (error) {
      console.error("[v0] Error creando wallet client:", error)
      return null
    }
  }, [wallets])

  return {
    walletClient,
    address: wallets[0]?.address,
    isConnected: wallets.length > 0,
  }
}
