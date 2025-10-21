"use client"

import { useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { usePrivy } from "@privy-io/react-auth"

interface GameSession {
  id: string
  bet_amount: number
  status: "waiting" | "playing" | "finished"
  score: number
  winnings: number
}

export function useGameLogic() {
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = usePrivy()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const joinGame = useCallback(
    async (betAmount: number) => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("game_sessions")
          .insert({
            user_id: user.id,
            bet_amount: betAmount,
            status: "waiting",
          })
          .select()
          .single()

        if (error) throw error

        setGameSession(data)

        // Simular inicio del juego después de 2 segundos
        setTimeout(() => {
          setGameSession((prev) => (prev ? { ...prev, status: "playing" } : null))
        }, 2000)
      } catch (error) {
        console.error("Error joining game:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [user, supabase],
  )

  const finishGame = useCallback(
    async (score: number) => {
      if (!gameSession) return

      try {
        const winnings = score > 100 ? gameSession.bet_amount * 2 : 0

        const { error } = await supabase
          .from("game_sessions")
          .update({
            status: "finished",
            score,
            winnings,
            ended_at: new Date().toISOString(),
          })
          .eq("id", gameSession.id)

        if (error) throw error

        setGameSession((prev) => (prev ? { ...prev, status: "finished", score, winnings } : null))
      } catch (error) {
        console.error("Error finishing game:", error)
      }
    },
    [gameSession, supabase],
  )

  return {
    gameSession,
    isLoading,
    joinGame,
    finishGame,
  }
}
