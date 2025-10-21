"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Position {
  x: number
  y: number
}

interface Snake {
  id: string
  segments: Position[]
  color: string
  direction: number
  speed: number
  isPlayer: boolean
}

interface Food {
  id: string
  x: number
  y: number
  color: string
  size: number
}

export function SlitherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"waiting" | "playing" | "gameOver">("waiting")
  const [score, setScore] = useState(0)
  const [snakes, setSnakes] = useState<Snake[]>([])
  const [food, setFood] = useState<Food[]>([])
  const mousePos = useRef<Position>({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  const CANVAS_WIDTH = typeof window !== "undefined" ? window.innerWidth : 1920
  const CANVAS_HEIGHT = typeof window !== "undefined" ? window.innerHeight : 1080
  const SEGMENT_SIZE = 10
  const FOOD_SIZE = 8
  const INITIAL_SNAKE_LENGTH = 10

  // Colores para serpientes
  const SNAKE_COLORS = [
    "#3b82f6", // blue
    "#ec4899", // pink
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
  ]

  // Generar posición aleatoria
  const getRandomPosition = useCallback((): Position => {
    return {
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT])

  // Crear serpiente
  const createSnake = useCallback(
    (isPlayer = false): Snake => {
      const startPos = getRandomPosition()
      const segments: Position[] = []
      const direction = Math.random() * Math.PI * 2

      for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        segments.push({
          x: startPos.x - Math.cos(direction) * SEGMENT_SIZE * i,
          y: startPos.y - Math.sin(direction) * SEGMENT_SIZE * i,
        })
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        segments,
        color: isPlayer ? "#00ff00" : SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)],
        direction,
        speed: isPlayer ? 3 : 2,
        isPlayer,
      }
    },
    [getRandomPosition, INITIAL_SNAKE_LENGTH, SEGMENT_SIZE],
  )

  // Crear comida
  const createFood = useCallback((): Food => {
    const pos = getRandomPosition()
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: pos.x,
      y: pos.y,
      color: SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)],
      size: FOOD_SIZE,
    }
  }, [getRandomPosition])

  // Inicializar juego
  const initGame = useCallback(() => {
    const playerSnake = createSnake(true)
    const aiSnakes = Array.from({ length: 5 }, () => createSnake(false))
    setSnakes([playerSnake, ...aiSnakes])

    const initialFood = Array.from({ length: 50 }, () => createFood())
    setFood(initialFood)

    setScore(0)
    setGameState("playing")
  }, [createSnake, createFood])

  // Manejar movimiento del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      // Limpiar canvas
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Dibujar grid
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 1
      for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }

      // Dibujar comida
      food.forEach((f) => {
        ctx.fillStyle = f.color
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Actualizar y dibujar serpientes
      setSnakes((prevSnakes) => {
        return prevSnakes.map((snake) => {
          let newDirection = snake.direction

          if (snake.isPlayer) {
            // Serpiente del jugador sigue el mouse
            const head = snake.segments[0]
            const dx = mousePos.current.x - head.x
            const dy = mousePos.current.y - head.y
            newDirection = Math.atan2(dy, dx)
          } else {
            // IA: buscar comida cercana
            const head = snake.segments[0]
            let closestFood = food[0]
            let minDist = Number.POSITIVE_INFINITY

            food.forEach((f) => {
              const dist = Math.hypot(f.x - head.x, f.y - head.y)
              if (dist < minDist) {
                minDist = dist
                closestFood = f
              }
            })

            if (closestFood) {
              const dx = closestFood.x - head.x
              const dy = closestFood.y - head.y
              const targetAngle = Math.atan2(dy, dx)

              // Suavizar el giro
              let angleDiff = targetAngle - snake.direction
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

              newDirection = snake.direction + angleDiff * 0.05
            }

            // Evitar bordes
            if (head.x < 100) newDirection = 0
            if (head.x > CANVAS_WIDTH - 100) newDirection = Math.PI
            if (head.y < 100) newDirection = Math.PI / 2
            if (head.y > CANVAS_HEIGHT - 100) newDirection = -Math.PI / 2
          }

          // Calcular nueva posición de la cabeza
          const head = snake.segments[0]
          const newHead: Position = {
            x: head.x + Math.cos(newDirection) * snake.speed,
            y: head.y + Math.sin(newDirection) * snake.speed,
          }

          // Wrap around edges
          if (newHead.x < 0) newHead.x = CANVAS_WIDTH
          if (newHead.x > CANVAS_WIDTH) newHead.x = 0
          if (newHead.y < 0) newHead.y = CANVAS_HEIGHT
          if (newHead.y > CANVAS_HEIGHT) newHead.y = 0

          // Actualizar segmentos
          const newSegments = [newHead, ...snake.segments.slice(0, -1)]

          return {
            ...snake,
            segments: newSegments,
            direction: newDirection,
          }
        })
      })

      // Dibujar serpientes
      snakes.forEach((snake) => {
        snake.segments.forEach((segment, index) => {
          const size = SEGMENT_SIZE - index * 0.05
          ctx.fillStyle = snake.color
          ctx.strokeStyle = snake.isPlayer ? "#ffffff" : "#000000"
          ctx.lineWidth = 2

          ctx.beginPath()
          ctx.arc(segment.x, segment.y, Math.max(size, 5), 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Ojos para la cabeza
          if (index === 0) {
            const eyeOffset = 5
            const eyeSize = 2
            ctx.fillStyle = "#ffffff"
            ctx.beginPath()
            ctx.arc(
              segment.x + Math.cos(snake.direction + 0.3) * eyeOffset,
              segment.y + Math.sin(snake.direction + 0.3) * eyeOffset,
              eyeSize,
              0,
              Math.PI * 2,
            )
            ctx.fill()
            ctx.beginPath()
            ctx.arc(
              segment.x + Math.cos(snake.direction - 0.3) * eyeOffset,
              segment.y + Math.sin(snake.direction - 0.3) * eyeOffset,
              eyeSize,
              0,
              Math.PI * 2,
            )
            ctx.fill()
          }
        })
      })

      // Detectar colisiones con comida
      setFood((prevFood) => {
        let newFood = [...prevFood]
        let foodEaten = false

        snakes.forEach((snake) => {
          const head = snake.segments[0]
          newFood = newFood.filter((f) => {
            const dist = Math.hypot(f.x - head.x, f.y - head.y)
            if (dist < SEGMENT_SIZE + FOOD_SIZE) {
              if (snake.isPlayer) {
                setScore((prev) => prev + 1)
                foodEaten = true
              }
              // Hacer crecer la serpiente
              setSnakes((prev) =>
                prev.map((s) =>
                  s.id === snake.id
                    ? {
                        ...s,
                        segments: [...s.segments, s.segments[s.segments.length - 1]],
                      }
                    : s,
                ),
              )
              return false
            }
            return true
          })
        })

        // Agregar nueva comida si se comió alguna
        if (foodEaten) {
          newFood.push(createFood())
        }

        return newFood
      })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, snakes, food, CANVAS_WIDTH, CANVAS_HEIGHT, SEGMENT_SIZE, FOOD_SIZE, createFood])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Score Display */}
      {gameState === "playing" && (
        <div className="absolute top-20 right-4 z-40">
          <Card className="bg-card/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{score}</div>
                <div className="text-xs text-muted-foreground">PUNTOS</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Longitud: {snakes.find((s) => s.isPlayer)?.segments.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute inset-0"
        style={{ cursor: gameState === "playing" ? "none" : "default" }}
      />

      {/* Start Screen */}
      {gameState === "waiting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30">
          <Card className="w-96">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">🐍 WormBruh</h2>
              <p className="text-muted-foreground">
                Mueve el ratón para controlar tu serpiente. Come la comida para crecer y evita chocar con otras
                serpientes.
              </p>
              <Button onClick={initGame} size="lg" className="w-full">
                Comenzar Juego
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30">
          <Card className="w-96">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">¡Juego Terminado!</h2>
              <div className="text-4xl font-bold text-primary">{score}</div>
              <p className="text-muted-foreground">Puntos Finales</p>
              <Button onClick={initGame} size="lg" className="w-full">
                Jugar de Nuevo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
