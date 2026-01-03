import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { playerId, userId, tableId } = await request.json()

    if (!playerId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Obtener información del jugador
    const { data: player } = await supabase
      .from("active_players")
      .select("*")
      .eq("id", playerId)
      .eq("user_id", userId)
      .single()

    if (player) {
      // Convertir el cuerpo en comida
      const segments = player.segments as { x: number; y: number }[]
      const foodItems = segments
        .filter((_, i) => i % 3 === 0)
        .map((seg) => ({
          table_id: tableId,
          x: seg.x,
          y: seg.y,
          value: (player.current_value / segments.length) * 3,
          color: player.color,
          size: 10,
        }))

      if (foodItems.length > 0) {
        await supabase.from("game_food_items").insert(foodItems)
      }

      // Registrar transacción de pérdida
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: -player.current_value,
        type: "game_death",
        description: `Died in game, lost $${player.current_value.toFixed(2)}`,
      })
    }

    // Eliminar jugador
    await supabase.from("active_players").delete().eq("id", playerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
