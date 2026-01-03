import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const FEE_PERCENTAGE = 0.1 // 10% fee

export async function POST(request: Request) {
  try {
    const { playerId, userId } = await request.json()

    if (!playerId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Obtener información del jugador
    const { data: player, error: playerError } = await supabase
      .from("active_players")
      .select("*")
      .eq("id", playerId)
      .eq("user_id", userId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    if (!player.is_alive) {
      return NextResponse.json({ error: "Player is already dead" }, { status: 400 })
    }

    const totalValue = player.current_value
    const feeAmount = totalValue * FEE_PERCENTAGE
    const finalAmount = totalValue - feeAmount

    // Actualizar wallet del usuario
    const { data: wallet } = await supabase.from("user_wallets").select("balance").eq("user_id", userId).single()

    if (wallet) {
      await supabase
        .from("user_wallets")
        .update({
          balance: wallet.balance + finalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      // Registrar transacción
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: finalAmount,
        type: "game_exit",
        description: `Safe exit with $${finalAmount.toFixed(2)} (after 10% fee)`,
      })
    }

    // Eliminar jugador de la partida
    await supabase.from("active_players").delete().eq("id", playerId)

    return NextResponse.json({
      success: true,
      totalValue,
      feeAmount,
      finalAmount,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
