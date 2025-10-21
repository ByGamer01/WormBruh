"use client"

import { useGameStats } from "@/hooks/use-game-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, Target } from "lucide-react"

export function RecentGames() {
  const { sessions, loading, formatPlayTime } = useGameStats()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Juegos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const recentSessions = sessions.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Juegos Recientes
        </CardTitle>
        <CardDescription>Tus últimas 10 partidas</CardDescription>
      </CardHeader>
      <CardContent>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aún no has jugado ninguna partida</p>
            <p className="text-sm text-muted-foreground mt-2">¡Comienza a jugar para ver tus estadísticas!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">#{index + 1}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{session.score.toLocaleString()} puntos</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Nivel {session.level}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatPlayTime(session.duration_seconds)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {new Date(session.completed_at).toLocaleDateString("es-ES")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.completed_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
