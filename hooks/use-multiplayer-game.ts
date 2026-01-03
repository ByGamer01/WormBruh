"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"

interface Player {
  id: string
  user_id: string
  username: string
  color: string
  x: number
  y: number
  segments: { x: number; y: number }[]
  current_value: number
  score: number
  is_alive: boolean
  is_boosting: boolean
  angle: number
}

interface Food {
  id: string
  x: number
  y: number
  value: number
  color: string
  size: number
}

interface ChatMessage {
  id: string
  username: string
  message: string
  is_system: boolean
  created_at: string
}

export function useMultiplayerGame(tableId: string | null) {
  const supabase = createBrowserClient()
  const { user } = useAuth()

  const [players, setPlayers] = useState<Player[]>([])
  const [food, setFood] = useState<Food[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (!tableId) return

    // Cargar jugadores
    const { data: playersData } = await supabase
      .from("active_players")
      .select("*")
      .eq("table_id", tableId)
      .eq("is_alive", true)

    if (playersData) {
      setPlayers(playersData)
      const me = playersData.find((p) => p.user_id === user?.id)
      if (me) setMyPlayer(me)
    }

    // Cargar comida
    const { data: foodData } = await supabase.from("game_food_items").select("*").eq("table_id", tableId)

    if (foodData) setFood(foodData)

    // Cargar chat
    const { data: chatData } = await supabase
      .from("game_chat")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (chatData) setChatMessages(chatData)
  }, [tableId, supabase, user?.id])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!tableId) return

    loadInitialData()

    const channel = supabase
      .channel(`game-${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_players",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player])
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p)))
            if (payload.new.user_id === user?.id) {
              setMyPlayer(payload.new as Player)
            }
          } else if (payload.eventType === "DELETE") {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_food_items",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setFood((prev) => [...prev, payload.new as Food])
          } else if (payload.eventType === "DELETE") {
            setFood((prev) => prev.filter((f) => f.id !== payload.old.id))
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_chat",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev.slice(-49), payload.new as ChatMessage])
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [tableId, supabase, loadInitialData, user?.id])

  // Actualizar posición del jugador
  const updatePosition = useCallback(
    async (
      x: number,
      y: number,
      segments: { x: number; y: number }[],
      angle: number,
      isBoosting: boolean,
      currentValue: number,
      score: number,
    ) => {
      if (!myPlayer) return

      await supabase
        .from("active_players")
        .update({
          x,
          y,
          segments,
          angle,
          is_boosting: isBoosting,
          current_value: currentValue,
          score,
          last_updated: new Date().toISOString(),
        })
        .eq("id", myPlayer.id)
    },
    [myPlayer, supabase],
  )

  // Comer comida
  const eatFood = useCallback(
    async (foodId: string) => {
      if (!myPlayer || !tableId) return null

      const foodItem = food.find((f) => f.id === foodId)
      if (!foodItem) return null

      // Eliminar localmente primero para respuesta rápida
      setFood((prev) => prev.filter((f) => f.id !== foodId))

      const response = await fetch("/api/game/eat-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId,
          playerId: myPlayer.id,
          tableId,
        }),
      })

      const data = await response.json()
      return data.valueGained || null
    },
    [myPlayer, tableId, food],
  )

  // Procesar kill
  const processKill = useCallback(
    async (victimId: string) => {
      if (!myPlayer || !tableId) return

      await fetch("/api/game/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          killerId: myPlayer.id,
          victimId,
          tableId,
        }),
      })
    },
    [myPlayer, tableId],
  )

  // Salir del juego
  const exitGame = useCallback(async () => {
    if (!myPlayer || !user) return null

    const response = await fetch("/api/game/exit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: myPlayer.id,
        userId: user.id,
      }),
    })

    return response.json()
  }, [myPlayer, user])

  // Reportar muerte
  const reportDeath = useCallback(async () => {
    if (!myPlayer || !user || !tableId) return

    await fetch("/api/game/death", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: myPlayer.id,
        userId: user.id,
        tableId,
      }),
    })
  }, [myPlayer, user, tableId])

  // Enviar mensaje de chat
  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!user || !tableId) return

      await fetch("/api/game/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          userId: user.id,
          username: user.email?.split("@")[0] || "Player",
          message,
        }),
      })
    },
    [user, tableId],
  )

  return {
    players,
    food,
    chatMessages,
    myPlayer,
    isConnected,
    updatePosition,
    eatFood,
    processKill,
    exitGame,
    reportDeath,
    sendChatMessage,
  }
}
