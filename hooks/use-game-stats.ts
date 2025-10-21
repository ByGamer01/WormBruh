"use client"

import { usePrivy } from "@privy-io/react-auth"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface GameSession {
  id: string
  score: number
  level: number
  duration_seconds: number
  completed_at: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string | null
  points: number
  earned_at?: string
}

interface GameStats {
  totalGames: number
  bestScore: number
  totalPlayTime: number
  averageScore: number
  bestLevel: number
  gamesThisWeek: number
  improvementRate: number
}

export function useGameStats() {
  const { user, authenticated } = usePrivy()
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    bestScore: 0,
    totalPlayTime: 0,
    averageScore: 0,
    bestLevel: 0,
    gamesThisWeek: 0,
    improvementRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Obtener sesiones de juego
  const fetchGameSessions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching game sessions:", error)
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      console.error("Error in fetchGameSessions:", error)
    }
  }

  // Obtener logros del usuario
  const fetchUserAchievements = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            points
          )
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false })

      if (error) {
        console.error("Error fetching achievements:", error)
      } else {
        const formattedAchievements = (data || []).map((item: any) => ({
          ...item.achievements,
          earned_at: item.earned_at,
        }))
        setAchievements(formattedAchievements)
      }
    } catch (error) {
      console.error("Error in fetchUserAchievements:", error)
    }
  }

  // Calcular estadísticas
  const calculateStats = () => {
    if (sessions.length === 0) return

    const totalGames = sessions.length
    const bestScore = Math.max(...sessions.map((s) => s.score))
    const totalPlayTime = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)
    const averageScore = Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / totalGames)
    const bestLevel = Math.max(...sessions.map((s) => s.level))

    // Juegos de esta semana
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const gamesThisWeek = sessions.filter((s) => new Date(s.completed_at) > oneWeekAgo).length

    // Tasa de mejora (comparar últimos 10 juegos con anteriores 10)
    let improvementRate = 0
    if (sessions.length >= 20) {
      const recent10 = sessions.slice(0, 10)
      const previous10 = sessions.slice(10, 20)
      const recentAvg = recent10.reduce((sum, s) => sum + s.score, 0) / 10
      const previousAvg = previous10.reduce((sum, s) => sum + s.score, 0) / 10
      improvementRate = Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
    }

    setStats({
      totalGames,
      bestScore,
      totalPlayTime,
      averageScore,
      bestLevel,
      gamesThisWeek,
      improvementRate,
    })
  }

  // Formatear tiempo de juego
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Efectos
  useEffect(() => {
    if (!authenticated || !user) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      await Promise.all([fetchGameSessions(), fetchUserAchievements()])
      setLoading(false)
    }

    loadData()
  }, [authenticated, user])

  useEffect(() => {
    calculateStats()
  }, [sessions])

  return {
    sessions,
    achievements,
    stats,
    loading,
    formatPlayTime,
    refetch: () => {
      setLoading(true)
      Promise.all([fetchGameSessions(), fetchUserAchievements()]).then(() => setLoading(false))
    },
  }
}
