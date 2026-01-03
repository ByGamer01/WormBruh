"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useWallet } from "@/hooks/use-wallet"

interface SnakeGameProps {
  betAmount: number
}

interface Point {
  x: number
  y: number
}

interface Snake {
  id: string
  segments: Point[]
  color: string
  direction: number
  speed: number
  isPlayer: boolean
  targetFood: Point | null
  score: number
}

interface Food {
  x: number
  y: number
  value: number
  color: string
}

export function SnakeGame({ betAmount }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [earnings, setEarnings] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const { addWinnings } = useWallet()

  const mousePos = useRef<Point>({ x: 400, y: 300 })
  const snakesRef = useRef<Snake[]>([])
  const foodRef = useRef<Food[]>([])
  const animationRef = useRef<number>()
  const gameOverRef = useRef(false)

  const WORLD_WIDTH = 2000
  const WORLD_HEIGHT = 2000
  const SEGMENT_SIZE = 12
  const INITIAL_SEGMENTS = 10
  const FOOD_VALUE = 0.01

  const generateColor = () => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8B500",
      "#FF6F61",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const createSnake = (isPlayer: boolean, id: string): Snake => {
    const startX = isPlayer ? WORLD_WIDTH / 2 : Math.random() * WORLD_WIDTH
    const startY = isPlayer ? WORLD_HEIGHT / 2 : Math.random() * WORLD_HEIGHT
    const segments: Point[] = []

    for (let i = 0; i < INITIAL_SEGMENTS; i++) {
      segments.push({ x: startX - i * SEGMENT_SIZE, y: startY })
    }

    return {
      id,
      segments,
      color: isPlayer ? "#00FF00" : generateColor(),
      direction: Math.random() * Math.PI * 2,
      speed: isPlayer ? 4 : 2 + Math.random() * 2,
      isPlayer,
      targetFood: null,
      score: 0,
    }
  }

  const createFood = (): Food => ({
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    value: FOOD_VALUE,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
  })

  const initGame = useCallback(() => {
    const snakes: Snake[] = [createSnake(true, "player")]

    for (let i = 0; i < 8; i++) {
      snakes.push(createSnake(false, `ai_${i}`))
    }

    snakesRef.current = snakes

    const food: Food[] = []
    for (let i = 0; i < 200; i++) {
      food.push(createFood())
    }
    foodRef.current = food

    setScore(0)
    setEarnings(0)
    setGameOver(false)
    gameOverRef.current = false
    setGameStarted(true)
  }, [])

  const findNearestFood = (snake: Snake): Food | null => {
    if (foodRef.current.length === 0) return null

    const head = snake.segments[0]
    let nearest: Food | null = null
    let minDist = Number.POSITIVE_INFINITY

    for (const food of foodRef.current) {
      const dist = Math.hypot(food.x - head.x, food.y - head.y)
      if (dist < minDist) {
        minDist = dist
        nearest = food
      }
    }

    return nearest
  }

  const updateSnake = (snake: Snake, canvas: HTMLCanvasElement) => {
    const head = snake.segments[0]

    if (snake.isPlayer) {
      const playerSnake = snakesRef.current.find((s) => s.isPlayer)
      if (!playerSnake) return

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      const targetX = head.x + (mousePos.current.x - centerX)
      const targetY = head.y + (mousePos.current.y - centerY)

      snake.direction = Math.atan2(targetY - head.y, targetX - head.x)
    } else {
      if (!snake.targetFood || Math.random() < 0.02) {
        snake.targetFood = findNearestFood(snake)
      }

      if (snake.targetFood) {
        const targetDir = Math.atan2(snake.targetFood.y - head.y, snake.targetFood.x - head.x)

        let diff = targetDir - snake.direction
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2

        snake.direction += diff * 0.1
      }

      if (head.x < 50) snake.direction = 0
      if (head.x > WORLD_WIDTH - 50) snake.direction = Math.PI
      if (head.y < 50) snake.direction = Math.PI / 2
      if (head.y > WORLD_HEIGHT - 50) snake.direction = -Math.PI / 2
    }

    const newHead = {
      x: head.x + Math.cos(snake.direction) * snake.speed,
      y: head.y + Math.sin(snake.direction) * snake.speed,
    }

    newHead.x = Math.max(0, Math.min(WORLD_WIDTH, newHead.x))
    newHead.y = Math.max(0, Math.min(WORLD_HEIGHT, newHead.y))

    snake.segments.unshift(newHead)
    snake.segments.pop()

    // Check food collision
    for (let i = foodRef.current.length - 1; i >= 0; i--) {
      const food = foodRef.current[i]
      const dist = Math.hypot(food.x - newHead.x, food.y - newHead.y)

      if (dist < SEGMENT_SIZE + 5) {
        foodRef.current.splice(i, 1)
        foodRef.current.push(createFood())

        snake.segments.push({ ...snake.segments[snake.segments.length - 1] })
        snake.score++

        if (snake.isPlayer) {
          setScore((prev) => prev + 1)
          setEarnings((prev) => prev + FOOD_VALUE)
        }
      }
    }

    // Check collision with other snakes (player only)
    if (snake.isPlayer) {
      for (const other of snakesRef.current) {
        if (other.id === snake.id) continue

        for (let i = 0; i < other.segments.length; i++) {
          const seg = other.segments[i]
          const dist = Math.hypot(seg.x - newHead.x, seg.y - newHead.y)

          if (dist < SEGMENT_SIZE) {
            gameOverRef.current = true
            setGameOver(true)
            return
          }
        }
      }
    }
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const playerSnake = snakesRef.current.find((s) => s.isPlayer)
      if (!playerSnake) return

      const cameraX = playerSnake.segments[0].x - canvas.width / 2
      const cameraY = playerSnake.segments[0].y - canvas.height / 2

      // Background
      ctx.fillStyle = "#1a1a2e"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = "#2a2a4e"
      ctx.lineWidth = 1
      const gridSize = 50
      const startX = -cameraX % gridSize
      const startY = -cameraY % gridSize

      for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Food
      for (const food of foodRef.current) {
        const screenX = food.x - cameraX
        const screenY = food.y - cameraY

        if (screenX > -20 && screenX < canvas.width + 20 && screenY > -20 && screenY < canvas.height + 20) {
          ctx.beginPath()
          ctx.arc(screenX, screenY, 6, 0, Math.PI * 2)
          ctx.fillStyle = food.color
          ctx.fill()

          ctx.beginPath()
          ctx.arc(screenX, screenY, 8, 0, Math.PI * 2)
          ctx.strokeStyle = food.color
          ctx.globalAlpha = 0.5
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // Snakes
      for (const snake of snakesRef.current) {
        const segments = snake.segments

        // Body
        for (let i = segments.length - 1; i >= 0; i--) {
          const seg = segments[i]
          const screenX = seg.x - cameraX
          const screenY = seg.y - cameraY

          if (screenX > -50 && screenX < canvas.width + 50 && screenY > -50 && screenY < canvas.height + 50) {
            const size = SEGMENT_SIZE - (i / segments.length) * 4

            ctx.beginPath()
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2)
            ctx.fillStyle = snake.color
            ctx.fill()

            if (snake.isPlayer) {
              ctx.strokeStyle = "#FFFFFF"
              ctx.lineWidth = 2
              ctx.stroke()
            }
          }
        }

        // Head with eyes
        const head = segments[0]
        const screenHeadX = head.x - cameraX
        const screenHeadY = head.y - cameraY

        if (
          screenHeadX > -50 &&
          screenHeadX < canvas.width + 50 &&
          screenHeadY > -50 &&
          screenHeadY < canvas.height + 50
        ) {
          // Eyes
          const eyeOffset = 5
          const eyeAngle1 = snake.direction + 0.5
          const eyeAngle2 = snake.direction - 0.5

          for (const angle of [eyeAngle1, eyeAngle2]) {
            const eyeX = screenHeadX + Math.cos(angle) * eyeOffset
            const eyeY = screenHeadY + Math.sin(angle) * eyeOffset

            ctx.beginPath()
            ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2)
            ctx.fillStyle = "#FFFFFF"
            ctx.fill()

            ctx.beginPath()
            ctx.arc(eyeX + Math.cos(snake.direction) * 1.5, eyeY + Math.sin(snake.direction) * 1.5, 2, 0, Math.PI * 2)
            ctx.fillStyle = "#000000"
            ctx.fill()
          }
        }
      }

      // UI
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "bold 24px sans-serif"
      ctx.fillText(`Score: ${score}`, 20, 40)
      ctx.fillText(`Earnings: $${earnings.toFixed(2)}`, 20, 70)
      ctx.fillText(`Bet: $${betAmount}`, 20, 100)
    },
    [score, earnings, betAmount],
  )

  const gameLoop = useCallback(() => {
    if (gameOverRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    for (const snake of snakesRef.current) {
      updateSnake(snake, canvas)
    }

    draw(ctx, canvas)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [draw])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleGameOver = async () => {
    if (earnings > 0) {
      await addWinnings(earnings)
    }
  }

  useEffect(() => {
    if (gameOver) {
      handleGameOver()
    }
  }, [gameOver])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)

    initGame()
    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initGame, gameLoop, handleMouseMove])

  if (gameOver) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
          <p className="text-2xl text-muted-foreground mb-2">Score: {score}</p>
          <p className="text-3xl text-primary font-bold mb-8">Earnings: ${earnings.toFixed(2)}</p>
          <button
            onClick={() => {
              initGame()
              animationRef.current = requestAnimationFrame(gameLoop)
            }}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return <canvas ref={canvasRef} className="fixed inset-0 cursor-none" style={{ touchAction: "none" }} />
}
