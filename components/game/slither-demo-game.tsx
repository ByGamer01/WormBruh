"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface Segment {
  x: number
  y: number
}

interface Worm {
  id: string
  name: string
  x: number
  y: number
  segments: Segment[]
  color: string
  targetX: number
  targetY: number
  speed: number
}

interface Food {
  x: number
  y: number
  color: string
}

export function SlitherDemoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [worms, setWorms] = useState<Worm[]>([])
  const [food, setFood] = useState<Food[]>([])
  const [myWorm, setMyWorm] = useState<Worm | null>(null)
  const [score, setScore] = useState(0)
  const mousePos = useRef({ x: 400, y: 300 })
  const animationFrameRef = useRef<number>()

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const INITIAL_LENGTH = 15
  const SEGMENT_RADIUS = 10
  const SPEED = 2.5
  const NUM_AI_WORMS = 8
  const NUM_FOOD = 50

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#FF85A2",
    "#7FDBFF",
    "#39CCCC",
    "#FF4136",
  ]

  // Initialize game
  useEffect(() => {
    // Create player worm
    const playerWorm: Worm = {
      id: "player",
      name: "You",
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      segments: Array(INITIAL_LENGTH)
        .fill(null)
        .map((_, i) => ({
          x: CANVAS_WIDTH / 2 - i * 3,
          y: CANVAS_HEIGHT / 2,
        })),
      color: "#00FF00",
      targetX: CANVAS_WIDTH / 2,
      targetY: CANVAS_HEIGHT / 2,
      speed: SPEED,
    }
    setMyWorm(playerWorm)

    // Create AI worms
    const aiWorms: Worm[] = Array(NUM_AI_WORMS)
      .fill(null)
      .map((_, i) => ({
        id: `ai-${i}`,
        name: `Player ${i + 1}`,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        segments: Array(INITIAL_LENGTH)
          .fill(null)
          .map(() => ({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
          })),
        color: colors[i % colors.length],
        targetX: Math.random() * CANVAS_WIDTH,
        targetY: Math.random() * CANVAS_HEIGHT,
        speed: SPEED * (0.8 + Math.random() * 0.4),
      }))
    setWorms(aiWorms)

    // Create food
    const initialFood: Food[] = Array(NUM_FOOD)
      .fill(null)
      .map(() => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    setFood(initialFood)
  }, [])

  // Game loop
  useEffect(() => {
    if (!myWorm) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      // Clear canvas with dark background
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw subtle grid
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 1
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(CANVAS_WIDTH, i)
        ctx.stroke()
      }

      // Update and draw food
      food.forEach((f, index) => {
        ctx.shadowBlur = 10
        ctx.shadowColor = f.color
        ctx.fillStyle = f.color
        ctx.beginPath()
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Update AI worms
      setWorms((prevWorms) =>
        prevWorms.map((worm) => {
          // Find nearest food
          let nearestFood = food[0]
          let minDist = Number.POSITIVE_INFINITY
          food.forEach((f) => {
            const dist = Math.sqrt((worm.x - f.x) ** 2 + (worm.y - f.y) ** 2)
            if (dist < minDist) {
              minDist = dist
              nearestFood = f
            }
          })

          // Move towards food or random target
          if (nearestFood && minDist < 200) {
            worm.targetX = nearestFood.x
            worm.targetY = nearestFood.y
          } else if (Math.abs(worm.x - worm.targetX) < 10 && Math.abs(worm.y - worm.targetY) < 10) {
            worm.targetX = Math.random() * CANVAS_WIDTH
            worm.targetY = Math.random() * CANVAS_HEIGHT
          }

          const dx = worm.targetX - worm.x
          const dy = worm.targetY - worm.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 5) {
            const newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, worm.x + (dx / distance) * worm.speed))
            const newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, worm.y + (dy / distance) * worm.speed))

            return {
              ...worm,
              x: newX,
              y: newY,
              segments: [{ x: worm.x, y: worm.y }, ...worm.segments.slice(0, -1)],
            }
          }

          return worm
        }),
      )

      // Draw AI worms
      worms.forEach((worm) => {
        worm.segments.forEach((segment, i) => {
          const radius = SEGMENT_RADIUS * (1 - i * 0.015)
          const alpha = 1 - i * 0.015

          ctx.globalAlpha = alpha
          ctx.fillStyle = worm.color
          ctx.shadowBlur = 5
          ctx.shadowColor = worm.color
          ctx.beginPath()
          ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.globalAlpha = 1
        ctx.shadowBlur = 10
        ctx.shadowColor = worm.color
        ctx.fillStyle = worm.color
        ctx.beginPath()
        ctx.arc(worm.x, worm.y, SEGMENT_RADIUS + 2, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.shadowBlur = 0
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(worm.x - 4, worm.y - 3, 3, 0, Math.PI * 2)
        ctx.arc(worm.x + 4, worm.y - 3, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#000000"
        ctx.beginPath()
        ctx.arc(worm.x - 4, worm.y - 3, 1.5, 0, Math.PI * 2)
        ctx.arc(worm.x + 4, worm.y - 3, 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Username
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 11px Arial"
        ctx.textAlign = "center"
        ctx.shadowBlur = 3
        ctx.shadowColor = "#000000"
        ctx.fillText(worm.name, worm.x, worm.y - 18)
        ctx.shadowBlur = 0
      })

      // Update player worm
      const dx = mousePos.current.x - myWorm.x
      const dy = mousePos.current.y - myWorm.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 5) {
        const newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, myWorm.x + (dx / distance) * SPEED))
        const newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, myWorm.y + (dy / distance) * SPEED))

        const newSegments = [{ x: myWorm.x, y: myWorm.y }, ...myWorm.segments.slice(0, -1)]

        setMyWorm({
          ...myWorm,
          x: newX,
          y: newY,
          segments: newSegments,
        })
      }

      // Check food collision for player
      setFood((prevFood) => {
        const remainingFood = prevFood.filter((f) => {
          const dist = Math.sqrt((myWorm.x - f.x) ** 2 + (myWorm.y - f.y) ** 2)
          if (dist < SEGMENT_RADIUS + 4) {
            setScore((prev) => prev + 1)
            setMyWorm((prev) =>
              prev
                ? {
                    ...prev,
                    segments: [...prev.segments, prev.segments[prev.segments.length - 1]],
                  }
                : null,
            )
            return false
          }
          return true
        })

        // Respawn food
        while (remainingFood.length < NUM_FOOD) {
          remainingFood.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }

        return remainingFood
      })

      // Draw player worm
      myWorm.segments.forEach((segment, i) => {
        const radius = SEGMENT_RADIUS * (1 - i * 0.015)
        const alpha = 1 - i * 0.015

        ctx.globalAlpha = alpha
        ctx.fillStyle = myWorm.color
        ctx.shadowBlur = 5
        ctx.shadowColor = myWorm.color
        ctx.beginPath()
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      ctx.shadowBlur = 15
      ctx.shadowColor = myWorm.color
      ctx.fillStyle = myWorm.color
      ctx.beginPath()
      ctx.arc(myWorm.x, myWorm.y, SEGMENT_RADIUS + 2, 0, Math.PI * 2)
      ctx.fill()

      // Eyes
      ctx.shadowBlur = 0
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(myWorm.x - 4, myWorm.y - 3, 3, 0, Math.PI * 2)
      ctx.arc(myWorm.x + 4, myWorm.y - 3, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#000000"
      ctx.beginPath()
      ctx.arc(myWorm.x - 4, myWorm.y - 3, 1.5, 0, Math.PI * 2)
      ctx.arc(myWorm.x + 4, myWorm.y - 3, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Username
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 11px Arial"
      ctx.textAlign = "center"
      ctx.shadowBlur = 3
      ctx.shadowColor = "#000000"
      ctx.fillText(myWorm.name, myWorm.x, myWorm.y - 18)
      ctx.shadowBlur = 0

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [myWorm, worms, food])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    }
  }

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="text-white font-bold text-lg">Score: {score}</div>
          <div className="text-green-400 text-sm">Length: {myWorm?.segments.length || 0}</div>
        </div>
        <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="text-white text-sm">Players: {worms.length + 1}</div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
          <div className="text-white text-sm">Move mouse to control</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        className="border-2 border-white/10 rounded-lg cursor-none shadow-2xl"
        style={{ maxWidth: "100%", maxHeight: "100vh" }}
      />
    </div>
  )
}
