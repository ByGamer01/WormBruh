"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Segment {
  x: number
  y: number
}

interface Player {
  id: string
  user_id: string
  username: string
  x: number
  y: number
  segments: Segment[]
  score: number
  color: string
  is_alive: boolean
}

interface Food {
  id: string
  x: number
  y: number
  value: number
  color: string
}

export function MultiplayerWormGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [players, setPlayers] = useState<Map<string, Player>>(new Map())
  const [food, setFood] = useState<Food[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [score, setScore] = useState(0)
  const [earnings, setEarnings] = useState(0)
  const mousePos = useRef({ x: 0, y: 0 })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const animationFrameRef = useRef<number>()

  const CANVAS_WIDTH = 2000
  const CANVAS_HEIGHT = 2000
  const INITIAL_LENGTH = 10
  const SEGMENT_RADIUS = 8
  const SPEED = 3

  // Initialize player
  const initializePlayer = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      user_id: user.id,
      username: user.email?.split("@")[0] || "Player",
      x: Math.random() * (CANVAS_WIDTH - 200) + 100,
      y: Math.random() * (CANVAS_HEIGHT - 200) + 100,
      segments: Array(INITIAL_LENGTH)
        .fill(null)
        .map((_, i) => ({
          x: Math.random() * (CANVAS_WIDTH - 200) + 100,
          y: Math.random() * (CANVAS_HEIGHT - 200) + 100,
        })),
      score: 0,
      color: randomColor,
      is_alive: true,
    }

    setMyPlayer(newPlayer)

    // Insert player into database
    await supabase.from("player_positions").insert({
      user_id: user.id,
      username: newPlayer.username,
      x: newPlayer.x,
      y: newPlayer.y,
      segments: newPlayer.segments,
      score: 0,
      color: randomColor,
      is_alive: true,
    })

    return newPlayer
  }, [supabase, router])

  // Subscribe to real-time updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const player = await initializePlayer()
      if (!player) return

      // Subscribe to player positions
      const channel = supabase
        .channel("game-room")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "player_positions",
          },
          (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              const playerData = payload.new as Player
              if (playerData.user_id !== player.user_id) {
                setPlayers((prev) => {
                  const newPlayers = new Map(prev)
                  newPlayers.set(playerData.user_id, playerData)
                  return newPlayers
                })
              }
            } else if (payload.eventType === "DELETE") {
              const playerData = payload.old as Player
              setPlayers((prev) => {
                const newPlayers = new Map(prev)
                newPlayers.delete(playerData.user_id)
                return newPlayers
              })
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_food",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const foodData = payload.new as Food
              setFood((prev) => [...prev, foodData])
            } else if (payload.eventType === "DELETE") {
              const foodData = payload.old as Food
              setFood((prev) => prev.filter((f) => f.id !== foodData.id))
            }
          },
        )
        .subscribe()

      channelRef.current = channel

      // Load existing players
      const { data: existingPlayers } = await supabase
        .from("player_positions")
        .select("*")
        .eq("is_alive", true)
        .neq("user_id", player.user_id)

      if (existingPlayers) {
        const playersMap = new Map<string, Player>()
        existingPlayers.forEach((p) => {
          playersMap.set(p.user_id, p as Player)
        })
        setPlayers(playersMap)
      }

      // Load existing food
      const { data: existingFood } = await supabase.from("game_food").select("*")

      if (existingFood) {
        setFood(existingFood as Food[])
      }
    }

    setupRealtimeSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (myPlayer) {
        supabase.from("player_positions").delete().eq("user_id", myPlayer.user_id)
      }
    }
  }, [supabase, initializePlayer, myPlayer])

  // Update player position
  const updatePlayerPosition = useCallback(
    async (player: Player) => {
      await supabase
        .from("player_positions")
        .update({
          x: player.x,
          y: player.y,
          segments: player.segments,
          score: player.score,
          last_updated: new Date().toISOString(),
        })
        .eq("user_id", player.user_id)
    },
    [supabase],
  )

  // Game loop
  useEffect(() => {
    if (!myPlayer) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 1
      for (let i = 0; i < CANVAS_WIDTH; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(CANVAS_WIDTH, i)
        ctx.stroke()
      }

      // Update my player position
      const dx = mousePos.current.x - myPlayer.x
      const dy = mousePos.current.y - myPlayer.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 5) {
        const newX = myPlayer.x + (dx / distance) * SPEED
        const newY = myPlayer.y + (dy / distance) * SPEED

        // Update segments
        const newSegments = [{ x: myPlayer.x, y: myPlayer.y }, ...myPlayer.segments.slice(0, -1)]

        const updatedPlayer = {
          ...myPlayer,
          x: newX,
          y: newY,
          segments: newSegments,
        }

        setMyPlayer(updatedPlayer)
        updatePlayerPosition(updatedPlayer)
      }

      // Draw food
      food.forEach((f) => {
        ctx.fillStyle = f.color
        ctx.beginPath()
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Check food collision
      food.forEach(async (f) => {
        const dist = Math.sqrt((myPlayer.x - f.x) ** 2 + (myPlayer.y - f.y) ** 2)
        if (dist < SEGMENT_RADIUS + 5) {
          // Eat food
          setScore((prev) => prev + 1)
          setEarnings((prev) => prev + f.value)

          // Add money to wallet
          await supabase.from("wallet_transactions").insert({
            user_id: myPlayer.user_id,
            amount: f.value,
            type: "game_reward",
            description: "Earned from eating food in WormBruh",
          })

          // Update wallet balance
          const { data: wallet } = await supabase
            .from("user_wallets")
            .select("balance")
            .eq("user_id", myPlayer.user_id)
            .single()

          if (wallet) {
            await supabase
              .from("user_wallets")
              .update({ balance: Number(wallet.balance) + f.value })
              .eq("user_id", myPlayer.user_id)
          }

          // Remove food
          await supabase.from("game_food").delete().eq("id", f.id)

          // Grow snake
          setMyPlayer((prev) =>
            prev
              ? {
                  ...prev,
                  segments: [...prev.segments, prev.segments[prev.segments.length - 1]],
                  score: prev.score + 1,
                }
              : null,
          )
        }
      })

      // Draw other players
      players.forEach((player) => {
        // Draw segments
        player.segments.forEach((segment, i) => {
          const radius = SEGMENT_RADIUS * (1 - i * 0.02)
          ctx.fillStyle = player.color
          ctx.globalAlpha = 1 - i * 0.01
          ctx.beginPath()
          ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })

        // Draw head
        ctx.globalAlpha = 1
        ctx.fillStyle = player.color
        ctx.beginPath()
        ctx.arc(player.x, player.y, SEGMENT_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        // Draw eyes
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(player.x - 3, player.y - 2, 2, 0, Math.PI * 2)
        ctx.arc(player.x + 3, player.y - 2, 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw username
        ctx.fillStyle = "#ffffff"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.fillText(player.username, player.x, player.y - 15)
      })

      // Draw my player
      myPlayer.segments.forEach((segment, i) => {
        const radius = SEGMENT_RADIUS * (1 - i * 0.02)
        ctx.fillStyle = myPlayer.color
        ctx.globalAlpha = 1 - i * 0.01
        ctx.beginPath()
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      ctx.fillStyle = myPlayer.color
      ctx.beginPath()
      ctx.arc(myPlayer.x, myPlayer.y, SEGMENT_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      // Draw eyes
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(myPlayer.x - 3, myPlayer.y - 2, 2, 0, Math.PI * 2)
      ctx.arc(myPlayer.x + 3, myPlayer.y - 2, 2, 0, Math.PI * 2)
      ctx.fill()

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [myPlayer, players, food, updatePlayerPosition, supabase])

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    mousePos.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
          <div className="text-white font-bold">Score: {score}</div>
          <div className="text-green-400 text-sm">Earned: ${earnings.toFixed(2)}</div>
        </div>
        <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
          <div className="text-white text-sm">Players: {players.size + 1}</div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-none"
      />
    </div>
  )
}
