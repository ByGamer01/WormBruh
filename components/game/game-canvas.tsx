"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { createClient } from "@/lib/supabase/client"

interface GameDot {
  id: string
  x: number
  y: number
  clicked: boolean
  timeLeft: number
}

interface GameStats {
  score: number
  level: number
  lives: number
  timeRemaining: number
}

export function GameCanvas() {
  const { user } = usePrivy()
  const supabase = createClient()
  const [gameState, setGameState] = useState<"waiting" | "playing" | "paused" | "gameOver">("waiting")
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    level: 1,
    lives: 3,
    timeRemaining: 60,
  })
  const [dots, setDots] = useState<GameDot[]>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameTimerRef = useRef<NodeJS.Timeout>()
  const dotSpawnTimerRef = useRef<NodeJS.Timeout>()

  // Generar posición aleatoria para un punto
  const generateRandomPosition = useCallback(() => {
    if (!gameAreaRef.current) return { x: 0, y: 0 }

    const rect = gameAreaRef.current.getBoundingClientRect()
    const margin = 50

    return {
      x: Math.random() * (rect.width - margin * 2) + margin,
      y: Math.random() * (rect.height - margin * 2) + margin,
    }
  }, [])

  // Crear nuevo punto
  const createDot = useCallback(() => {
    const position = generateRandomPosition()
    const newDot: GameDot = {
      id: Math.random().toString(36).substr(2, 9),
      x: position.x,
      y: position.y,
      clicked: false,
      timeLeft: Math.max(3000 - stats.level * 200, 1000), // Menos tiempo en niveles altos
    }

    setDots((prev) => [...prev, newDot])

    // Eliminar el punto después de su tiempo de vida
    setTimeout(() => {
      setDots((prev) => prev.filter((dot) => dot.id !== newDot.id))
      // Perder vida si no se hizo clic
      setStats((prevStats) => {
        const newLives = prevStats.lives - 1
        if (newLives <= 0) {
          setGameState("gameOver")
        }
        return { ...prevStats, lives: newLives }
      })
    }, newDot.timeLeft)
  }, [generateRandomPosition, stats.level])

  // Hacer clic en un punto
  const handleDotClick = useCallback(
    (dotId: string) => {
      setDots((prev) => prev.map((dot) => (dot.id === dotId ? { ...dot, clicked: true } : dot)))

      // Eliminar el punto después de la animación
      setTimeout(() => {
        setDots((prev) => prev.filter((dot) => dot.id !== dotId))
      }, 200)

      // Aumentar puntuación
      const pointsEarned = stats.level * 10
      setStats((prev) => {
        const newScore = prev.score + pointsEarned
        const newLevel = Math.floor(newScore / 500) + 1
        return {
          ...prev,
          score: newScore,
          level: newLevel,
        }
      })
    },
    [stats.level],
  )

  // Iniciar juego
  const startGame = useCallback(() => {
    setGameState("playing")
    setGameStartTime(Date.now())
    setStats({
      score: 0,
      level: 1,
      lives: 3,
      timeRemaining: 60,
    })
    setDots([])

    // Timer principal del juego
    gameTimerRef.current = setInterval(() => {
      setStats((prev) => {
        const newTime = prev.timeRemaining - 1
        if (newTime <= 0) {
          setGameState("gameOver")
          return { ...prev, timeRemaining: 0 }
        }
        return { ...prev, timeRemaining: newTime }
      })
    }, 1000)

    // Spawn de puntos
    const spawnDots = () => {
      if (gameState === "playing") {
        createDot()
        const nextSpawnTime = Math.max(2000 - stats.level * 100, 500)
        dotSpawnTimerRef.current = setTimeout(spawnDots, nextSpawnTime)
      }
    }
    spawnDots()
  }, [createDot, gameState, stats.level])

  // Pausar/reanudar juego
  const togglePause = useCallback(() => {
    if (gameState === "playing") {
      setGameState("paused")
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (dotSpawnTimerRef.current) clearTimeout(dotSpawnTimerRef.current)
    } else if (gameState === "paused") {
      setGameState("playing")
      // Reanudar timers
      gameTimerRef.current = setInterval(() => {
        setStats((prev) => {
          const newTime = prev.timeRemaining - 1
          if (newTime <= 0) {
            setGameState("gameOver")
            return { ...prev, timeRemaining: 0 }
          }
          return { ...prev, timeRemaining: newTime }
        })
      }, 1000)
    }
  }, [gameState])

  // Guardar puntuación al finalizar
  const saveScore = useCallback(async () => {
    if (!user) return

    try {
      const duration = Math.floor((Date.now() - gameStartTime) / 1000)

      // Guardar sesión de juego
      await supabase.from("game_sessions").insert({
        user_id: user.id,
        score: stats.score,
        level: stats.level,
        duration_seconds: duration,
      })

      // Actualizar puntuación máxima si es necesario
      const { data: existingScore } = await supabase
        .from("high_scores")
        .select("score")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(1)
        .single()

      if (!existingScore || stats.score > existingScore.score) {
        await supabase.from("high_scores").upsert({
          user_id: user.id,
          score: stats.score,
          level: stats.level,
        })
      }
    } catch (error) {
      console.error("Error saving score:", error)
    }
  }, [user, stats, gameStartTime, supabase])

  // Reiniciar juego
  const resetGame = useCallback(() => {
    setGameState("waiting")
    setDots([])
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (dotSpawnTimerRef.current) clearTimeout(dotSpawnTimerRef.current)
  }, [])

  // Efectos
  useEffect(() => {
    if (gameState === "gameOver") {
      saveScore()
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (dotSpawnTimerRef.current) clearTimeout(dotSpawnTimerRef.current)
    }
  }, [gameState, saveScore])

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (dotSpawnTimerRef.current) clearTimeout(dotSpawnTimerRef.current)
    }
  }, [])

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header del juego */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="score-display">{stats.score}</div>
              <div className="text-xs text-muted-foreground">PUNTOS</div>
            </div>
            <div className="text-center">
              <div className="level-display">Nivel {stats.level}</div>
              <div className="text-xs text-muted-foreground">NIVEL</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-500">{"❤️".repeat(stats.lives)}</div>
              <div className="text-xs text-muted-foreground">VIDAS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-500">{stats.timeRemaining}s</div>
              <div className="text-xs text-muted-foreground">TIEMPO</div>
            </div>
          </div>

          <div className="flex gap-2">
            {gameState === "waiting" && (
              <Button onClick={startGame} size="lg">
                Iniciar Juego
              </Button>
            )}
            {(gameState === "playing" || gameState === "paused") && (
              <Button onClick={togglePause} variant="outline">
                {gameState === "paused" ? "Reanudar" : "Pausar"}
              </Button>
            )}
            {gameState === "gameOver" && (
              <Button onClick={resetGame} size="lg">
                Jugar de Nuevo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Área de juego */}
      <div
        ref={gameAreaRef}
        className="game-container flex-1 relative"
        style={{ cursor: gameState === "playing" ? "crosshair" : "default" }}
      >
        {/* Puntos del juego */}
        {dots.map((dot) => (
          <div
            key={dot.id}
            className={`game-dot ${dot.clicked ? "clicked" : ""}`}
            style={{
              left: dot.x,
              top: dot.y,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => !dot.clicked && handleDotClick(dot.id)}
          />
        ))}

        {/* Overlay de estado */}
        {gameState === "waiting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-center">¡Listo para Jugar!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Haz clic en los puntos que aparecen en pantalla para ganar puntos. ¡Sé rápido antes de que
                  desaparezcan!
                </p>
                <Button onClick={startGame} size="lg" className="w-full">
                  Comenzar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-center">Juego Pausado</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={togglePause} size="lg" className="w-full">
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="text-center">¡Juego Terminado!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">{stats.score}</div>
                  <div className="text-muted-foreground">Puntos Finales</div>
                  <div className="text-sm text-muted-foreground">Nivel alcanzado: {stats.level}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={resetGame} size="lg" className="flex-1">
                    Jugar de Nuevo
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex-1 bg-transparent">
                    <a href="/leaderboard">Ver Ranking</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
