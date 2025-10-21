"use client"

import { useGameStats } from "@/hooks/use-game-stats"
import { useReferralSystem } from "@/hooks/use-referral-system"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Trophy, Clock, Target, Users, Gift, Zap } from "lucide-react"

export function StatsOverview() {
  const { stats: gameStats, loading: gameLoading, formatPlayTime } = useGameStats()
  const { stats: referralStats, loading: referralLoading } = useReferralSystem()

  if (gameLoading || referralLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Mejor Puntuación */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div className="text-sm font-medium text-muted-foreground">Mejor Puntuación</div>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{gameStats.bestScore.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Nivel {gameStats.bestLevel}</div>
        </CardContent>
      </Card>

      {/* Total de Juegos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-primary" />
            <div className="text-sm font-medium text-muted-foreground">Total Juegos</div>
          </div>
          <div className="text-2xl font-bold">{gameStats.totalGames}</div>
          <div className="text-xs text-muted-foreground">Esta semana: {gameStats.gamesThisWeek}</div>
        </CardContent>
      </Card>

      {/* Tiempo de Juego */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="text-sm font-medium text-muted-foreground">Tiempo Total</div>
          </div>
          <div className="text-2xl font-bold text-blue-500">{formatPlayTime(gameStats.totalPlayTime)}</div>
          <div className="text-xs text-muted-foreground">Promedio: {gameStats.averageScore} pts</div>
        </CardContent>
      </Card>

      {/* Mejora */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            {gameStats.improvementRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <div className="text-sm font-medium text-muted-foreground">Mejora</div>
          </div>
          <div className={`text-2xl font-bold ${gameStats.improvementRate >= 0 ? "text-green-500" : "text-red-500"}`}>
            {gameStats.improvementRate >= 0 ? "+" : ""}
            {gameStats.improvementRate}%
          </div>
          <div className="text-xs text-muted-foreground">Últimos 10 juegos</div>
        </CardContent>
      </Card>

      {/* Referidos Totales */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div className="text-sm font-medium text-muted-foreground">Referidos</div>
          </div>
          <div className="text-2xl font-bold text-purple-500">{referralStats.totalReferrals}</div>
          <div className="text-xs text-muted-foreground">Confirmados: {referralStats.confirmedReferrals}</div>
        </CardContent>
      </Card>

      {/* Recompensas Pendientes */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-orange-500" />
            <div className="text-sm font-medium text-muted-foreground">Recompensas</div>
          </div>
          <div className="text-2xl font-bold text-orange-500">{referralStats.pendingRewards}</div>
          <div className="text-xs text-muted-foreground">Ganados: {referralStats.totalRewardsEarned} pts</div>
        </CardContent>
      </Card>

      {/* Progreso Semanal */}
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <div className="text-sm font-medium text-muted-foreground">Progreso Semanal</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Juegos esta semana</span>
              <span>
                {gameStats.gamesThisWeek}/10 <Badge variant="secondary">Meta</Badge>
              </span>
            </div>
            <Progress value={(gameStats.gamesThisWeek / 10) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
