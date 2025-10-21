"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { useWallet } from "@/hooks/use-wallet"
import { createClient } from "@/lib/supabase/client"

interface Position {
  x: number
  y: number
}

interface SnakeSegment extends Position {
  id: string
}

interface Food extends Position {
  id: string
  value: number
  type: "normal" | "bonus" | "player"
}

interface Player {
  id: string
  segments: SnakeSegment[]
  direction: Position
  color: string
  money: number
  isAlive: boolean
  username: string
}

interface GameState {
  status: "waiting" | "playing" | "gameOver"
  money: number
  score: number
  level: number
  playTime: number
}

interface SnakeGameProps {
  betAmount: number
}

const GRID_SIZE = 20
const INITIAL_SPEED = 150
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export function SnakeGame({ betAmount }: SnakeGameProps) {
  const { user, authenticated } = usePrivy()
  const { addWinnings } = useWallet()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const [currentGameSessionId, setCurrentGameSessionId] = useState<string | null>(null)

  const [gameState, setGameState] = useState<GameState>({
    status: "waiting",
    money: 0,
    score: 0,
    level: 1,
    playTime: 0,
  })

  const [player, setPlayer] = useState<Player>({
    id: "player",
    segments: [
      { id: "1", x: 10, y: 10 },
      { id: "2", x: 9, y: 10 },
      { id: "3", x: 8, y: 10 },
    ],
    direction: { x: 1, y: 0 },
    color: "#10b981",
    money: 0,
    isAlive: true,
    username: user?.email?.split("@")[0] || "Player",
  })

  const [food, setFood] = useState<Food[]>([])
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([])
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED)

  const generateFood = useCallback(() => {
    const newFood: Food = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      value: Math.floor(Math.random() * 50) + 10,
      type: Math.random() > 0.8 ? "bonus" : "normal",
    }
    return newFood
  }, [])

  const generateBotPlayer = useCallback(() => {
    const colors = ["#3b82f6", "#ec4899", "#f59e0b", "#8b5cf6", "#ef4444"]
    const names = ["Bot_Alpha", "Bot_Beta", "Bot_Gamma", "Bot_Delta", "Bot_Omega"]

    const botPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      segments: [
        {
          id: "1",
          x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
          y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
        },
      ],
      direction: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
      color: colors[Math.floor(Math.random() * colors.length)],
      money: Math.floor(Math.random() * 500) + 100,
      isAlive: true,
      username: names[Math.floor(Math.random() * names.length)],
    }

    // Agregar más segmentos al bot
    for (let i = 1; i < 3; i++) {
      botPlayer.segments.push({
        id: (i + 1).toString(),
        x: botPlayer.segments[0].x - i,
        y: botPlayer.segments[0].y,
      })
    }

    return botPlayer
  }, [])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState.status !== "playing") return

      setPlayer((prev) => {
        let newDirection = prev.direction

        switch (event.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (prev.direction.y === 0) newDirection = { x: 0, y: -1 }
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (prev.direction.y === 0) newDirection = { x: 0, y: 1 }
            break
          case "ArrowLeft":
          case "a":
          case "A":
            if (prev.direction.x === 0) newDirection = { x: -1, y: 0 }
            break
          case "ArrowRight":
          case "d":
          case "D":
            if (prev.direction.x === 0) newDirection = { x: 1, y: 0 }
            break
        }

        return { ...prev, direction: newDirection }
      })
    },
    [gameState.status],
  )

  const moveSnake = useCallback(
    (snake: Player) => {
      const head = snake.segments[0]
      const newHead: SnakeSegment = {
        id: Math.random().toString(36).substr(2, 9),
        x: head.x + snake.direction.x,
        y: head.y + snake.direction.y,
      }

      // Verificar colisiones con bordes
      if (
        newHead.x < 0 ||
        newHead.x >= CANVAS_WIDTH / GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= CANVAS_HEIGHT / GRID_SIZE
      ) {
        return { ...snake, isAlive: false }
      }

      // Verificar colisiones consigo mismo
      if (snake.segments.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        return { ...snake, isAlive: false }
      }

      const newSegments = [newHead, ...snake.segments]

      // Verificar si comió comida
      const eatenFood = food.find((f) => f.x === newHead.x && f.y === newHead.y)
      if (eatenFood) {
        // Crecer y ganar dinero
        setFood((prev) => prev.filter((f) => f.id !== eatenFood.id))
        setGameState((prev) => ({
          ...prev,
          money: prev.money + eatenFood.value,
          score: prev.score + eatenFood.value,
        }))

        return {
          ...snake,
          segments: newSegments,
          money: snake.money + eatenFood.value,
        }
      } else {
        // Mover sin crecer
        return {
          ...snake,
          segments: newSegments.slice(0, -1),
        }
      }
    },
    [food],
  )

  const checkPlayerCollisions = useCallback(() => {
    const playerHead = player.segments[0]

    otherPlayers.forEach((otherPlayer) => {
      if (!otherPlayer.isAlive) return

      // Verificar si el jugador choca con otro jugador
      const collision = otherPlayer.segments.some((segment) => segment.x === playerHead.x && segment.y === playerHead.y)

      if (collision) {
        // El jugador mata al otro y gana su dinero
        setGameState((prev) => ({
          ...prev,
          money: prev.money + otherPlayer.money,
          score: prev.score + otherPlayer.money,
        }))

        setOtherPlayers((prev) => prev.map((p) => (p.id === otherPlayer.id ? { ...p, isAlive: false } : p)))

        console.log(`[v0] ¡Mataste a ${otherPlayer.username} y ganaste $${otherPlayer.money}!`)
      }
    })
  }, [player.segments, otherPlayers])

  const moveBots = useCallback(() => {
    setOtherPlayers((prev) =>
      prev.map((bot) => {
        if (!bot.isAlive) return bot

        // IA simple: cambiar dirección aleatoriamente
        if (Math.random() < 0.1) {
          const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ]
          bot.direction = directions[Math.floor(Math.random() * directions.length)]
        }

        return moveSnake(bot)
      }),
    )
  }, [moveSnake])

  const saveGameSession = useCallback(async () => {
    if (!authenticated || !user) return null

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert({
          user_id: user.id,
          score: gameState.score,
          level: gameState.level,
          duration_seconds: Math.floor(gameState.playTime / 10),
        })
        .select()
        .single()

      if (error) throw error

      console.log("[v0] Partida guardada exitosamente")
      return data?.id || null
    } catch (error) {
      console.error("[v0] Error guardando partida:", error)
      return null
    }
  }, [authenticated, user, gameState, supabase])

  const endGame = useCallback(async () => {
    if (gameState.status !== "playing") return

    setGameState((prev) => ({ ...prev, status: "gameOver" }))

    const sessionId = await saveGameSession()

    if (gameState.money > 0 && authenticated) {
      const success = await addWinnings(gameState.money, sessionId)
      if (success) {
        console.log(`[v0] Se agregaron $${gameState.money} al wallet`)
      }
    }
  }, [gameState, saveGameSession, addWinnings, authenticated])

  const gameLoop = useCallback(() => {
    if (gameState.status !== "playing") return

    // Mover jugador
    setPlayer((prev) => {
      const movedPlayer = moveSnake(prev)
      if (!movedPlayer.isAlive) {
        setTimeout(endGame, 100)
      }
      return movedPlayer
    })

    // Mover bots
    moveBots()

    // Verificar colisiones entre jugadores
    checkPlayerCollisions()

    // Generar comida aleatoriamente
    if (Math.random() < 0.3 && food.length < 5) {
      setFood((prev) => [...prev, generateFood()])
    }

    // Actualizar tiempo de juego
    setGameState((prev) => ({ ...prev, playTime: prev.playTime + 1 }))
  }, [gameState.status, moveSnake, moveBots, checkPlayerCollisions, food.length, generateFood, endGame])

  const startGame = useCallback(async () => {
    if (authenticated && user) {
      try {
        const { data, error } = await supabase
          .from("game_sessions")
          .insert({
            user_id: user.id,
            score: 0,
            level: 1,
            duration_seconds: 0,
          })
          .select()
          .single()

        if (!error && data) {
          setCurrentGameSessionId(data.id)
        }
      } catch (error) {
        console.error("[v0] Error creando sesión de juego:", error)
      }
    }

    setGameState({
      status: "playing",
      money: 0,
      score: 0,
      level: 1,
      playTime: 0,
    })

    // Resetear jugador
    setPlayer((prev) => ({
      ...prev,
      segments: [
        { id: "1", x: 10, y: 10 },
        { id: "2", x: 9, y: 10 },
        { id: "3", x: 8, y: 10 },
      ],
      direction: { x: 1, y: 0 },
      money: 0,
      isAlive: true,
    }))

    // Generar comida inicial
    setFood([generateFood(), generateFood(), generateFood()])

    // Generar bots enemigos
    const bots = Array.from({ length: 3 }, () => generateBotPlayer())
    setOtherPlayers(bots)
  }, [generateFood, generateBotPlayer, authenticated, user, supabase])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Dibujar comida
    food.forEach((f) => {
      ctx.fillStyle = f.type === "bonus" ? "#fbbf24" : "#10b981"
      ctx.fillRect(f.x * GRID_SIZE, f.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2)

      // Mostrar valor de la comida
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`$${f.value}`, f.x * GRID_SIZE + GRID_SIZE / 2, f.y * GRID_SIZE + GRID_SIZE / 2 + 4)
    })

    // Dibujar jugador
    if (player.isAlive) {
      player.segments.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#059669" : player.color
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2)

        // Dibujar ojos en la cabeza
        if (index === 0) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(segment.x * GRID_SIZE + 4, segment.y * GRID_SIZE + 4, 3, 3)
          ctx.fillRect(segment.x * GRID_SIZE + 13, segment.y * GRID_SIZE + 4, 3, 3)
        }
      })
    }

    // Dibujar otros jugadores
    otherPlayers.forEach((otherPlayer) => {
      if (!otherPlayer.isAlive) return

      otherPlayer.segments.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? otherPlayer.color : `${otherPlayer.color}aa`
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2)
      })

      // Mostrar nombre y dinero del jugador
      const head = otherPlayer.segments[0]
      ctx.fillStyle = "#ffffff"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(
        `${otherPlayer.username} ($${otherPlayer.money})`,
        head.x * GRID_SIZE + GRID_SIZE / 2,
        head.y * GRID_SIZE - 5,
      )
    })
  }, [player, otherPlayers, food])

  // Efectos
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (gameState.status === "playing") {
      gameLoopRef.current = window.setInterval(() => {
        gameLoop()
        render()
      }, gameSpeed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState.status, gameLoop, render, gameSpeed])

  useEffect(() => {
    render()
  }, [render])

  return (
    <div className="w-full h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mb-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">${gameState.money.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">DINERO GANADO</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-accent">{gameState.score}</div>
                  <div className="text-xs text-muted-foreground">PUNTOS</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{player.segments.length}</div>
                  <div className="text-xs text-muted-foreground">LONGITUD</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">{Math.floor(gameState.playTime / 10)}s</div>
                  <div className="text-xs text-muted-foreground">TIEMPO</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">${betAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">APUESTA</div>
                </div>
              </div>

              <div className="flex gap-2">
                {gameState.status === "waiting" && (
                  <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/90">
                    🐍 Iniciar Juego
                  </Button>
                )}
                {gameState.status === "gameOver" && (
                  <Button onClick={startGame} size="lg" className="bg-primary hover:bg-primary/90">
                    🔄 Jugar de Nuevo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-border rounded-lg bg-background"
        />

        {/* Overlay de instrucciones */}
        {gameState.status === "waiting" && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <Card className="w-96">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-2xl font-bold text-primary">🐍 Snake Battle</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Usa WASD o las flechas para moverte</p>
                  <p>• Come puntos para ganar dinero 💰</p>
                  <p>• Mata otros jugadores para robar su dinero</p>
                  <p>• ¡No choques con las paredes o contigo mismo!</p>
                  <p className="text-primary font-bold">Apuesta: ${betAmount}</p>
                </div>
                <Button onClick={startGame} size="lg" className="w-full">
                  ¡Empezar a Jugar!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overlay de game over */}
        {gameState.status === "gameOver" && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-lg">
            <Card className="w-96">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-3xl font-bold text-destructive">💀 Game Over</h3>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">${gameState.money.toFixed(2)}</div>
                  <div className="text-muted-foreground">Dinero Ganado en esta Partida</div>
                  <div className="text-sm text-muted-foreground">
                    Ganancia Neta: ${(gameState.money - betAmount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Puntos: {gameState.score} | Tiempo: {Math.floor(gameState.playTime / 10)}s
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={startGame} size="lg" className="flex-1">
                    Jugar de Nuevo
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex-1 bg-transparent">
                    <a href="/">Volver al Lobby</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {gameState.status === "playing" && (
        <div className="w-full max-w-4xl mt-4">
          <Card className="bg-card/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-muted-foreground">JUGADORES EN VIVO</h4>
                <div className="flex gap-4 text-xs">
                  <span className="text-primary">
                    🟢 {player.username}: ${player.money.toFixed(2)}
                  </span>
                  {otherPlayers
                    .filter((p) => p.isAlive)
                    .map((p) => (
                      <span key={p.id} style={{ color: p.color }}>
                        🔴 {p.username}: ${p.money.toFixed(2)}
                      </span>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
