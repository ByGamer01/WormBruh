import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const FEE_PERCENTAGE = 0.1 // 10% fee
const WORLD_SIZE = 4000

export async function POST(request: Request) {
  try {
    const { killerId, victimId, tableId } = await request.json()

    if (!victimId || !tableId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Obtener información de la víctima
    const { data: victim, error: victimError } = await supabase
      .from("active_players")
      .select("*")
      .eq("id", victimId)
      .single()

    if (victimError || !victim) {
      return NextResponse.json({ error: "Victim not found" }, { status: 404 })
    }

    const victimValue = victim.current_value
    const feeAmount = victimValue * FEE_PERCENTAGE
    const killerReward = victimValue - feeAmount

    // Marcar víctima como muerta
    await supabase.from("active_players").update({ is_alive: false }).eq("id", victimId)

    // Convertir segmentos de la víctima en comida
    const segments = victim.segments as { x: number; y: number }[]
    const foodItems = segments
      .filter((_, i) => i % 3 === 0)
      .map((seg) => ({
        table_id: tableId,
        x: seg.x,
        y: seg.y,
        value: (victimValue / segments.length) * 3,
        color: victim.color,
        size: 10,
      }))

    if (foodItems.length > 0) {
      await supabase.from("game_food_items").insert(foodItems)
    }

    // Si hay un killer (no es suicidio), darle la recompensa
    if (killerId) {
      const { data: killer } = await supabase
        .from("active_players")
        .select("current_value, user_id")
        .eq("id", killerId)
        .single()

      if (killer) {
        await supabase
          .from("active_players")
          .update({ current_value: killer.current_value + killerReward })
          .eq("id", killerId)

        // Registrar el kill
        await supabase.from("game_kills").insert({
          table_id: tableId,
          killer_id: killer.user_id,
          victim_id: victim.user_id,
          victim_value: victimValue,
          killer_reward: killerReward,
          fee_amount: feeAmount,
        })
      }
    }

    return NextResponse.json({
      success: true,
      victimValue,
      killerReward,
      feeAmount,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
