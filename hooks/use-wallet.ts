"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePrivy } from "@privy-io/react-auth"

interface WalletData {
  balance: number
  totalDeposited: number
  totalWithdrawn: number
}

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "game_win" | "game_loss" | "bet"
  amount: number
  description: string
  created_at: string
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { authenticated, user } = usePrivy()

  const fetchWallet = async () => {
    if (!authenticated || !user) return

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (walletError && walletError.code !== "PGRST116") {
        console.error("[v0] Error fetching wallet:", walletError)
        return
      }

      if (walletData) {
        setWallet({
          balance: Number.parseFloat(walletData.balance),
          totalDeposited: Number.parseFloat(walletData.total_deposited),
          totalWithdrawn: Number.parseFloat(walletData.total_withdrawn),
        })
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (transactionsData && !transactionsError) {
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error("[v0] Error in fetchWallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addFunds = async (amount: number) => {
    if (!authenticated || !user) return false

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error: transactionError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        description: `Depósito de $${amount}`,
      })

      if (transactionError) throw transactionError

      const { error: walletError } = await supabase.from("user_wallets").upsert({
        user_id: user.id,
        balance: wallet.balance + amount,
        total_deposited: wallet.totalDeposited + amount,
        updated_at: new Date().toISOString(),
      })

      if (walletError) throw walletError

      await fetchWallet()
      return true
    } catch (error) {
      console.error("[v0] Error adding funds:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const placeBet = async (amount: number, gameSessionId?: string) => {
    if (!authenticated || !user || wallet.balance < amount) return false

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error: transactionError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "bet",
        amount: -amount,
        description: `Apuesta de $${amount}`,
        game_session_id: gameSessionId,
      })

      if (transactionError) throw transactionError

      const { error: walletError } = await supabase
        .from("user_wallets")
        .update({
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (walletError) throw walletError

      await fetchWallet()
      return true
    } catch (error) {
      console.error("[v0] Error placing bet:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const addWinnings = async (amount: number, gameSessionId?: string) => {
    if (!authenticated || !user) return false

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error: transactionError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "game_win",
        amount: amount,
        description: `Ganancia de $${amount}`,
        game_session_id: gameSessionId,
      })

      if (transactionError) throw transactionError

      const { error: walletError } = await supabase
        .from("user_wallets")
        .update({
          balance: wallet.balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (walletError) throw walletError

      await fetchWallet()
      return true
    } catch (error) {
      console.error("[v0] Error adding winnings:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated && user) {
      fetchWallet()
    }
  }, [authenticated, user])

  return {
    wallet,
    transactions,
    isLoading,
    addFunds,
    placeBet,
    addWinnings,
    fetchWallet,
  }
}
