"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"

interface Segment {
  x: number
  y: number
}

interface Worm {
  id: string
  name: string
  segments: Segment[]
  color: string
  angle: number
  speed: number
  isBoosting: boolean
  value: number // Dinero que representa esta serpiente
  isPlayer: boolean
  targetAngle?: number
  isDead: boolean
}

interface Food {
  id: string
  x: number
  y: number
  value: number
  color: string
  size: number
}

interface WormBruhGameProps {
  betAmount: number
  onExit: (earnings: number) => void
}

const WORLD_SIZE = 4000
const WORM_RADIUS = 12
const BASE_SPEED = 3
const BOOST_SPEED = 6
const BOOST_SHRINK_RATE = 0.02
const MIN_SEGMENTS = 10
const FOOD_SPAWN_RATE = 100
const MAX_FOOD = 800
const BOT_COUNT = 25
const FEE_PERCENTAGE = 0.1 // 10% fee

const WORM_COLORS = [
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
  "#00CED1",
  "#FF69B4",
  "#32CD32",
  "#FF4500",
]

const generateId = () => Math.random().toString(36).substr(2, 9)

const BOT_NAMES = [
  "SlitherKing",
  "VenomBite",
  "CoilMaster",
  "ScaleHunter",
  "FangDanger",
  "NightCrawler",
  "ToxicTail",
  "ShadowStrike",
  "DeathCoil",
  "VipersNest",
  "CryptoSnake",
  "DiamondScale",
  "GoldFang",
  "SilverSlither",
  "PlatinumCoil",
  "ApexPredator",
  "AlphaWorm",
  "BetaBite",
  "GammaGlide",
  "DeltaDash",
  "SolanaSlayer",
  "BlockChainBite",
  "Web3Worm",
  "NFTNibbler",
  "DeFiDanger",
]

export function WormBruhGame({ betAmount, onExit }: WormBruhGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"playing" | "dead" | "exiting">("playing")
  const [score, setScore] = useState(0)
  const [earnings, setEarnings] = useState(0)
  const [kills, setKills] = useState(0)
  const [exitProgress, setExitProgress] = useState(0)
  const [chatMessages, setChatMessages] = useState<{ name: string; message: string; time: number }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [showChat, setShowChat] = useState(true)
  const [playerName] = useState("You")

  const { addWinnings } = useWallet()

  const wormsRef = useRef<Worm[]>([])
  const foodRef = useRef<Food[]>([])
  const playerRef = useRef<Worm | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const cameraRef = useRef({ x: 0, y: 0 })
  const isBoostingRef = useRef(false)
  const exitHoldRef = useRef(false)
  const exitStartTimeRef = useRef(0)
  const gameLoopRef = useRef<number | null>(null)

  // Crear serpiente
  const createWorm = useCallback((x: number, y: number, isPlayer: boolean, name: string, value: number): Worm => {
    const segments: Segment[] = []
    const segmentCount = Math.max(MIN_SEGMENTS, Math.floor(value * 2))

    for (let i = 0; i < segmentCount; i++) {
      segments.push({ x: x - i * 8, y })
    }

    return {
      id: generateId(),
      name,
      segments,
      color: isPlayer ? "#00FF00" : WORM_COLORS[Math.floor(Math.random() * WORM_COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      speed: BASE_SPEED,
      isBoosting: false,
      value,
      isPlayer,
      targetAngle: Math.random() * Math.PI * 2,
      isDead: false,
    }
  }, [])

  // Crear comida
  const createFood = useCallback((x?: number, y?: number, value?: number): Food => {
    return {
      id: generateId(),
      x: x ?? Math.random() * WORLD_SIZE,
      y: y ?? Math.random() * WORLD_SIZE,
      value: value ?? (Math.random() < 0.1 ? 0.05 : 0.01),
      color: Math.random() < 0.1 ? "#FFD700" : `hsl(${Math.random() * 360}, 70%, 60%)`,
      size: Math.random() < 0.1 ? 12 : 8,
    }
  }, [])

  // Inicializar juego
  useEffect(() => {
    // Crear jugador en el centro
    const player = createWorm(WORLD_SIZE / 2, WORLD_SIZE / 2, true, playerName, betAmount)
    playerRef.current = player

    // Crear bots con valores aleatorios
    const bots: Worm[] = []
    for (let i = 0; i < BOT_COUNT; i++) {
      const botValue = Math.random() * betAmount * 3 + 0.5
      const bot = createWorm(
        Math.random() * WORLD_SIZE,
        Math.random() * WORLD_SIZE,
        false,
        BOT_NAMES[i % BOT_NAMES.length],
        botValue,
      )
      bots.push(bot)
    }
    wormsRef.current = [player, ...bots]

    // Crear comida inicial
    const initialFood: Food[] = []
    for (let i = 0; i < MAX_FOOD; i++) {
      initialFood.push(createFood())
    }
    foodRef.current = initialFood

    // Mensaje inicial del chat
    setChatMessages([
      { name: "System", message: `Welcome to WormBruh! Bet: $${betAmount}`, time: Date.now() },
      { name: "System", message: "Hold Q to safely exit and keep your earnings!", time: Date.now() },
    ])
  }, [betAmount, createWorm, createFood, playerName])

  // Manejar mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseDown = () => {
      isBoostingRef.current = true
    }

    const handleMouseUp = () => {
      isBoostingRef.current = false
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Manejar tecla Q para salir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q" && gameState === "playing") {
        if (!exitHoldRef.current) {
          exitHoldRef.current = true
          exitStartTimeRef.current = Date.now()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q") {
        exitHoldRef.current = false
        setExitProgress(0)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      const player = playerRef.current
      if (!player || player.isDead) return

      // Check exit progress
      if (exitHoldRef.current) {
        const holdTime = (Date.now() - exitStartTimeRef.current) / 1000
        const progress = Math.min(holdTime / 3, 1) // 3 seconds to exit
        setExitProgress(progress)

        if (progress >= 1) {
          // Safe exit - keep earnings
          const finalEarnings = earnings * (1 - FEE_PERCENTAGE)
          setGameState("exiting")
          addWinnings(finalEarnings)
          setTimeout(() => onExit(finalEarnings), 1000)
          return
        }
      }

      // Update player angle based on mouse
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const targetAngle = Math.atan2(mouseRef.current.y - centerY, mouseRef.current.x - centerX)

      // Smooth angle interpolation
      let angleDiff = targetAngle - player.angle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      player.angle += angleDiff * 0.15

      // Boost mechanics
      player.isBoosting = isBoostingRef.current && player.segments.length > MIN_SEGMENTS
      player.speed = player.isBoosting ? BOOST_SPEED : BASE_SPEED

      // Shrink while boosting
      if (player.isBoosting && player.segments.length > MIN_SEGMENTS) {
        if (Math.random() < BOOST_SHRINK_RATE) {
          const lostSegment = player.segments.pop()
          if (lostSegment) {
            // Drop food where segment was lost
            foodRef.current.push(createFood(lostSegment.x, lostSegment.y, 0.005))
          }
        }
      }

      // Move player
      const head = player.segments[0]
      const newHead = {
        x: head.x + Math.cos(player.angle) * player.speed,
        y: head.y + Math.sin(player.angle) * player.speed,
      }

      // World bounds
      newHead.x = Math.max(50, Math.min(WORLD_SIZE - 50, newHead.x))
      newHead.y = Math.max(50, Math.min(WORLD_SIZE - 50, newHead.y))

      player.segments.unshift(newHead)
      player.segments.pop()

      // Update camera
      cameraRef.current = {
        x: newHead.x - canvas.width / 2,
        y: newHead.y - canvas.height / 2,
      }

      // Update bots
      wormsRef.current.forEach((worm) => {
        if (worm.isPlayer || worm.isDead) return

        // Bot AI - find nearest food or chase smaller worms
        let nearestFood: Food | null = null
        let nearestDist = Number.POSITIVE_INFINITY

        foodRef.current.forEach((food) => {
          const dist = Math.hypot(food.x - worm.segments[0].x, food.y - worm.segments[0].y)
          if (dist < nearestDist) {
            nearestDist = dist
            nearestFood = food
          }
        })

        // Sometimes chase smaller worms
        if (Math.random() < 0.01) {
          wormsRef.current.forEach((target) => {
            if (target.id === worm.id || target.isDead) return
            if (target.segments.length < worm.segments.length * 0.7) {
              const dist = Math.hypot(
                target.segments[0].x - worm.segments[0].x,
                target.segments[0].y - worm.segments[0].y,
              )
              if (dist < 300) {
                worm.targetAngle = Math.atan2(
                  target.segments[0].y - worm.segments[0].y,
                  target.segments[0].x - worm.segments[0].x,
                )
              }
            }
          })
        }

        if (nearestFood && nearestDist < 500) {
          worm.targetAngle = Math.atan2(nearestFood.y - worm.segments[0].y, nearestFood.x - worm.segments[0].x)
        } else if (Math.random() < 0.02) {
          worm.targetAngle = Math.random() * Math.PI * 2
        }

        // Smooth angle
        let diff = (worm.targetAngle ?? worm.angle) - worm.angle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        worm.angle += diff * 0.08

        // Random boost
        worm.isBoosting = Math.random() < 0.05 && worm.segments.length > MIN_SEGMENTS
        worm.speed = worm.isBoosting ? BOOST_SPEED * 0.8 : BASE_SPEED * 0.9

        if (worm.isBoosting && Math.random() < BOOST_SHRINK_RATE) {
          const lostSegment = worm.segments.pop()
          if (lostSegment) {
            foodRef.current.push(createFood(lostSegment.x, lostSegment.y, 0.005))
          }
        }

        // Move bot
        const botHead = worm.segments[0]
        const newBotHead = {
          x: botHead.x + Math.cos(worm.angle) * worm.speed,
          y: botHead.y + Math.sin(worm.angle) * worm.speed,
        }

        // Bounce off walls
        if (newBotHead.x < 100 || newBotHead.x > WORLD_SIZE - 100) {
          worm.angle = Math.PI - worm.angle
        }
        if (newBotHead.y < 100 || newBotHead.y > WORLD_SIZE - 100) {
          worm.angle = -worm.angle
        }

        newBotHead.x = Math.max(50, Math.min(WORLD_SIZE - 50, newBotHead.x))
        newBotHead.y = Math.max(50, Math.min(WORLD_SIZE - 50, newBotHead.y))

        worm.segments.unshift(newBotHead)
        worm.segments.pop()
      })

      // Check food collision for all worms
      wormsRef.current.forEach((worm) => {
        if (worm.isDead) return

        const head = worm.segments[0]
        foodRef.current = foodRef.current.filter((food) => {
          const dist = Math.hypot(food.x - head.x, food.y - head.y)
          if (dist < WORM_RADIUS + food.size) {
            // Eat food
            worm.segments.push({ ...worm.segments[worm.segments.length - 1] })
            worm.value += food.value

            if (worm.isPlayer) {
              setScore((prev) => prev + 1)
              setEarnings((prev) => prev + food.value)
            }
            return false
          }
          return true
        })
      })

      // Check worm collisions
      wormsRef.current.forEach((worm) => {
        if (worm.isDead) return

        const head = worm.segments[0]

        wormsRef.current.forEach((other) => {
          if (other.id === worm.id || other.isDead) return

          // Check if head hits other worm's body (not head)
          for (let i = 5; i < other.segments.length; i++) {
            const seg = other.segments[i]
            const dist = Math.hypot(head.x - seg.x, head.y - seg.y)

            if (dist < WORM_RADIUS * 2) {
              // Worm died!
              worm.isDead = true

              // Drop food where worm died
              worm.segments.forEach((s, idx) => {
                if (idx % 3 === 0) {
                  foodRef.current.push(createFood(s.x, s.y, (worm.value / worm.segments.length) * 3))
                }
              })

              // Other worm gets the kill value
              if (other.isPlayer) {
                const killValue = worm.value * (1 - FEE_PERCENTAGE)
                setKills((prev) => prev + 1)
                setEarnings((prev) => prev + killValue)
                setChatMessages((prev) => [
                  ...prev.slice(-10),
                  {
                    name: "System",
                    message: `You killed ${worm.name}! +$${killValue.toFixed(2)}`,
                    time: Date.now(),
                  },
                ])
              }

              if (worm.isPlayer) {
                setGameState("dead")
              }

              break
            }
          }
        })
      })

      // Respawn bots
      const aliveBotsCount = wormsRef.current.filter((w) => !w.isPlayer && !w.isDead).length
      if (aliveBotsCount < BOT_COUNT) {
        const newBot = createWorm(
          Math.random() * WORLD_SIZE,
          Math.random() * WORLD_SIZE,
          false,
          BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
          Math.random() * betAmount * 2 + 0.5,
        )
        wormsRef.current.push(newBot)
      }

      // Spawn more food
      if (foodRef.current.length < MAX_FOOD && Math.random() < 0.3) {
        foodRef.current.push(createFood())
      }

      // RENDER
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 1
      const gridSize = 50
      const offsetX = -cameraRef.current.x % gridSize
      const offsetY = -cameraRef.current.y % gridSize

      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw world border
      ctx.strokeStyle = "#FF0000"
      ctx.lineWidth = 4
      ctx.strokeRect(-cameraRef.current.x, -cameraRef.current.y, WORLD_SIZE, WORLD_SIZE)

      // Draw food
      foodRef.current.forEach((food) => {
        const screenX = food.x - cameraRef.current.x
        const screenY = food.y - cameraRef.current.y

        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return

        // Glow effect
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, food.size * 2)
        gradient.addColorStop(0, food.color)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(screenX, screenY, food.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = food.color
        ctx.beginPath()
        ctx.arc(screenX, screenY, food.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw worms
      wormsRef.current.forEach((worm) => {
        if (worm.isDead) return

        // Draw body segments
        worm.segments.forEach((seg, idx) => {
          const screenX = seg.x - cameraRef.current.x
          const screenY = seg.y - cameraRef.current.y

          if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return

          const radius = WORM_RADIUS * (1 - idx * 0.005)
          const alpha = 1 - idx * 0.01

          // Glow for player
          if (worm.isPlayer && idx === 0) {
            ctx.shadowColor = worm.color
            ctx.shadowBlur = 20
          }

          ctx.fillStyle =
            worm.color +
            Math.floor(alpha * 255)
              .toString(16)
              .padStart(2, "0")
          ctx.beginPath()
          ctx.arc(screenX, screenY, Math.max(4, radius), 0, Math.PI * 2)
          ctx.fill()

          ctx.shadowBlur = 0
        })

        // Draw eyes on head
        const head = worm.segments[0]
        const screenX = head.x - cameraRef.current.x
        const screenY = head.y - cameraRef.current.y

        if (screenX >= -50 && screenX <= canvas.width + 50 && screenY >= -50 && screenY <= canvas.height + 50) {
          const eyeOffset = 6
          const eyeRadius = 5
          const pupilRadius = 3

          const leftEyeX = screenX + Math.cos(worm.angle - 0.5) * eyeOffset
          const leftEyeY = screenY + Math.sin(worm.angle - 0.5) * eyeOffset
          const rightEyeX = screenX + Math.cos(worm.angle + 0.5) * eyeOffset
          const rightEyeY = screenY + Math.sin(worm.angle + 0.5) * eyeOffset

          // Eye whites
          ctx.fillStyle = "#FFFFFF"
          ctx.beginPath()
          ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2)
          ctx.fill()

          // Pupils
          ctx.fillStyle = "#000000"
          ctx.beginPath()
          ctx.arc(leftEyeX + Math.cos(worm.angle) * 2, leftEyeY + Math.sin(worm.angle) * 2, pupilRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(
            rightEyeX + Math.cos(worm.angle) * 2,
            rightEyeY + Math.sin(worm.angle) * 2,
            pupilRadius,
            0,
            Math.PI * 2,
          )
          ctx.fill()

          // Draw name and value above worm
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "bold 12px Arial"
          ctx.textAlign = "center"
          ctx.fillText(worm.name, screenX, screenY - 25)
          ctx.fillStyle = "#00FF00"
          ctx.font = "10px Arial"
          ctx.fillText(`$${worm.value.toFixed(2)}`, screenX, screenY - 12)
        }
      })

      // Draw minimap
      const minimapSize = 150
      const minimapX = canvas.width - minimapSize - 10
      const minimapY = canvas.height - minimapSize - 10

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize)
      ctx.strokeStyle = "#333"
      ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize)

      // Draw worms on minimap
      wormsRef.current.forEach((worm) => {
        if (worm.isDead) return
        const mx = minimapX + (worm.segments[0].x / WORLD_SIZE) * minimapSize
        const my = minimapY + (worm.segments[0].y / WORLD_SIZE) * minimapSize
        ctx.fillStyle = worm.isPlayer ? "#00FF00" : worm.color
        ctx.beginPath()
        ctx.arc(mx, my, worm.isPlayer ? 4 : 2, 0, Math.PI * 2)
        ctx.fill()
      })

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, betAmount, earnings, createFood, createWorm, addWinnings, onExit])

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [
      ...prev.slice(-10),
      {
        name: playerName,
        message: chatInput,
        time: Date.now(),
      },
    ])
    setChatInput("")
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 1920}
        height={typeof window !== "undefined" ? window.innerHeight : 1080}
        className="block"
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 text-white z-10">
        <div className="bg-black/70 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-400">${earnings.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Earnings (10% fee on exit)</div>
          <div className="mt-2">
            <span className="text-yellow-400">Score: {score}</span>
            <span className="mx-2">|</span>
            <span className="text-red-400">Kills: {kills}</span>
          </div>
        </div>
      </div>

      {/* Exit progress */}
      {exitProgress > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/80 rounded-lg p-4 text-center">
            <div className="text-white mb-2">Hold Q to exit safely...</div>
            <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${exitProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/50 text-sm z-10">
        <div>Mouse: Move | Click: Boost | Hold Q: Safe Exit</div>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="absolute bottom-4 right-4 w-72 z-10">
          <div className="bg-black/70 rounded-lg backdrop-blur-sm overflow-hidden">
            <div className="p-2 border-b border-white/10 flex justify-between items-center">
              <span className="text-white font-bold text-sm">Chat</span>
              <Button size="sm" variant="ghost" className="text-white/50 h-6 px-2" onClick={() => setShowChat(false)}>
                ×
              </Button>
            </div>
            <div className="h-32 overflow-y-auto p-2 space-y-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className={msg.name === "System" ? "text-yellow-400" : "text-blue-400"}>{msg.name}:</span>{" "}
                  <span className="text-white/80">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-white/10">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type message..."
                className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {!showChat && (
        <Button className="absolute bottom-4 right-4 z-10" onClick={() => setShowChat(true)}>
          Chat
        </Button>
      )}

      {/* Game Over Screen */}
      {gameState === "dead" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="bg-gray-900 rounded-xl p-8 text-center max-w-md">
            <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
            <div className="text-6xl mb-4">💀</div>
            <div className="space-y-2 mb-6">
              <div className="text-gray-400">You were eaten!</div>
              <div className="text-2xl text-white">Score: {score}</div>
              <div className="text-xl text-red-400">Kills: {kills}</div>
              <div className="text-3xl text-yellow-400">Lost: ${betAmount.toFixed(2)}</div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => onExit(0)} className="bg-gray-700 hover:bg-gray-600">
                Back to Lobby
              </Button>
              <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-500">
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exiting Screen */}
      {gameState === "exiting" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="bg-gray-900 rounded-xl p-8 text-center max-w-md">
            <h2 className="text-4xl font-bold text-green-500 mb-4">SAFE EXIT!</h2>
            <div className="text-6xl mb-4">🎉</div>
            <div className="space-y-2 mb-6">
              <div className="text-gray-400">You safely cashed out!</div>
              <div className="text-2xl text-white">Score: {score}</div>
              <div className="text-xl text-red-400">Kills: {kills}</div>
              <div className="text-lg text-gray-400">Earnings: ${earnings.toFixed(2)} - 10% fee</div>
              <div className="text-3xl text-green-400">Profit: ${(earnings * (1 - FEE_PERCENTAGE)).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
