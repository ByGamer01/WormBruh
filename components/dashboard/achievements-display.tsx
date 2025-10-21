"use client"

import { useGameStats } from "@/hooks/use-game-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Lock } from "lucide-react"

export function AchievementsDisplay() {
  const { achievements, loading } = useGameStats()

  // Lista de todos los logros posibles (esto debería venir de la base de datos)
  const allAchievements = [
    { name: "first_game", description: "Juega tu primera partida", icon: "🎮", points: 10 },
    { name: "score_100", description: "Alcanza 100 puntos", icon: "💯", points: 25 },
    { name: "score_500", description: "Alcanza 500 puntos", icon: "🔥", points: 50 },
    { name: "score_1000", description: "Alcanza 1000 puntos", icon: "⭐", points: 100 },
    { name: "level_5", description: "Alcanza el nivel 5", icon: "🚀", points: 75 },
    { name: "level_10", description: "Alcanza el nivel 10", icon: "👑", points: 150 },
    { name: "referral_master", description: "Refiere a 5 amigos", icon: "🤝", points: 200 },
    { name: "daily_player", description: "Juega 7 días consecutivos", icon: "📅", points: 125 },
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const earnedAchievements = new Set(achievements.map((a) => a.name))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Logros
        </CardTitle>
        <CardDescription>
          {achievements.length} de {allAchievements.length} logros desbloqueados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allAchievements.map((achievement) => {
            const isEarned = earnedAchievements.has(achievement.name)
            const earnedData = achievements.find((a) => a.name === achievement.name)

            return (
              <div
                key={achievement.name}
                className={`p-4 border rounded-lg text-center transition-all ${
                  isEarned ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-muted opacity-60 grayscale"
                }`}
              >
                <div className="text-2xl mb-2">
                  {isEarned ? achievement.icon : <Lock className="h-6 w-6 mx-auto text-muted-foreground" />}
                </div>
                <div className="text-sm font-medium mb-1">{achievement.description}</div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={isEarned ? "default" : "secondary"} className="text-xs">
                    {achievement.points} pts
                  </Badge>
                  {isEarned && earnedData && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(earnedData.earned_at!).toLocaleDateString("es-ES")}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
