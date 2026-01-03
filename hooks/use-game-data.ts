"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"

export function useGameData() {
  const { user } = useAuth()
  const authenticated = !!user
  const [leaderboard, setLeaderboard] = useState([
    { username: "Quantum", winnings: 7681.62 },
    { username: "Mr-1221z", winnings: 5911.08 },
    { username: "Denis237", winnings: 5865.62 },
  ])
  const [globalStats, setGlobalStats] = useState({
    playersInGame: 27,
    totalWinnings: 286918,
  })

  const saveGameSession = async (sessionData: any) => {
    if (!authenticated || !user) return null

    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert({
          score: sessionData.score,
          level: sessionData.level || 1,
          duration_seconds: sessionData.duration || 30,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  const updateLeaderboard = async () => {
    const supabase = createBrowserClient()

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          score,
          user_id
        `)
        .order("score", { ascending: false })
        .limit(10)

      if (data && !error) {
        const formattedData = data.map((item: any) => ({
          username: `Player_${item.user_id.slice(-4)}`,
          winnings: item.score * 0.01,
        }))
        setLeaderboard(formattedData)
      }
    } catch (error) {
      // Silent error
    }
  }

  useEffect(() => {
    updateLeaderboard()

    const interval = setInterval(() => {
      setGlobalStats((prev) => ({
        playersInGame: Math.floor(Math.random() * 50) + 20,
        totalWinnings: prev.totalWinnings + Math.floor(Math.random() * 100),
      }))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    leaderboard,
    globalStats,
    saveGameSession,
    updateLeaderboard,
  }
}
