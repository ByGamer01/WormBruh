import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const WORLD_SIZE = 4000

export async function POST(request: Request) {
  try {
    const { foodId, playerId, tableId } = await request.json()

    if (!foodId || !playerId || !tableId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Obtener información de la comida
    const { data: food, error: foodError } = await supabase
      .from("game_food_items")
      .select("*")
      .eq("id", foodId)
      .single()

    if (foodError || !food) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 })
    }

    // Eliminar la comida
    await supabase.from("game_food_items").delete().eq("id", foodId)

    // Actualizar el valor del jugador
    const { data: player } = await supabase
      .from("active_players")
      .select("current_value, score")
      .eq("id", playerId)
      .single()

    if (player) {
      await supabase
        .from("active_players")
        .update({
          current_value: player.current_value + food.value,
          score: player.score + 1,
        })
        .eq("id", playerId)
    }

    // Generar nueva comida para reemplazar
    const isGold = Math.random() < 0.1
    await supabase.from("game_food_items").insert({
      table_id: tableId,
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      value: isGold ? 0.05 : 0.01,
      color: isGold ? "#FFD700" : `hsl(${Math.random() * 360}, 70%, 60%)`,
      size: isGold ? 12 : 8,
    })

    return NextResponse.json({
      success: true,
      valueGained: food.value,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
