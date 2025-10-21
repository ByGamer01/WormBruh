"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LeaderboardEntry {
  id: string
  score: number
  level: number
  achieved_at: string
  profiles: {
    display_name: string | null
    username: string | null
  }
}

export function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from("high_scores")
          .select(`
            id,
            score,
            level,
            achieved_at,
            profiles!inner (
              display_name,
              username
            )
          `)
          .order("score", { ascending: false })
          .limit(50)

        if (error) {
          console.error("Error fetching leaderboard:", error)
        } else {
          setEntries(data || [])
        }
      } catch (error) {
        console.error("Error in fetchLeaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando tabla de posiciones...</p>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Aún no hay puntuaciones registradas. ¡Sé el primero en jugar!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🏆 Tabla de Posiciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index === 0
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : index === 1
                    ? "bg-gray-500/10 border-gray-500/20"
                    : index === 2
                      ? "bg-orange-500/10 border-orange-500/20"
                      : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold w-8 text-center">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                </div>
                <div>
                  <div className="font-semibold">
                    {entry.profiles.display_name || entry.profiles.username || "Usuario Anónimo"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.achieved_at).toLocaleDateString("es-ES")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</div>
                <Badge variant="secondary" className="text-xs">
                  Nivel {entry.level}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
