import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

const WORLD_SIZE = 4000

export async function POST(request: Request) {
  try {
    const { userId, username, stakeAmount } = await request.json()

    if (!userId || !stakeAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verificar que el usuario tiene fondos suficientes
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    if (wallet.balance < stakeAmount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 })
    }

    // Obtener o crear la mesa de juego
    let { data: table } = await supabase
      .from("game_tables")
      .select("*")
      .eq("stake_amount", stakeAmount)
      .eq("is_active", true)
      .single()

    if (!table) {
      const { data: newTable, error: tableError } = await supabase
        .from("game_tables")
        .insert({ stake_amount: stakeAmount, max_players: 50 })
        .select()
        .single()

      if (tableError) {
        return NextResponse.json({ error: "Could not create table" }, { status: 500 })
      }
      table = newTable
    }

    // Descontar la apuesta del wallet
    const { error: deductError } = await supabase
      .from("user_wallets")
      .update({ balance: wallet.balance - stakeAmount })
      .eq("user_id", userId)

    if (deductError) {
      return NextResponse.json({ error: "Could not deduct stake" }, { status: 500 })
    }

    // Registrar transacción
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount: -stakeAmount,
      type: "game_stake",
      description: `Joined $${stakeAmount} table`,
    })

    // Crear posición inicial del jugador
    const spawnX = Math.random() * (WORLD_SIZE - 400) + 200
    const spawnY = Math.random() * (WORLD_SIZE - 400) + 200
    const color = WORM_COLORS[Math.floor(Math.random() * WORM_COLORS.length)]

    // Crear segmentos iniciales
    const segments = []
    for (let i = 0; i < 15; i++) {
      segments.push({ x: spawnX - i * 8, y: spawnY })
    }

    // Eliminar posición anterior si existe
    await supabase.from("active_players").delete().eq("user_id", userId)

    // Insertar nuevo jugador
    const { data: player, error: playerError } = await supabase
      .from("active_players")
      .insert({
        user_id: userId,
        table_id: table.id,
        username: username || "Player",
        color,
        x: spawnX,
        y: spawnY,
        segments,
        current_value: stakeAmount,
        is_alive: true,
      })
      .select()
      .single()

    if (playerError) {
      // Revertir la transacción si falla
      await supabase.from("user_wallets").update({ balance: wallet.balance }).eq("user_id", userId)

      return NextResponse.json({ error: "Could not join game" }, { status: 500 })
    }

    // Generar comida inicial si no hay suficiente
    const { count } = await supabase
      .from("game_food_items")
      .select("*", { count: "exact", head: true })
      .eq("table_id", table.id)

    if ((count ?? 0) < 500) {
      const foodItems = []
      for (let i = 0; i < 500 - (count ?? 0); i++) {
        const isGold = Math.random() < 0.1
        foodItems.push({
          table_id: table.id,
          x: Math.random() * WORLD_SIZE,
          y: Math.random() * WORLD_SIZE,
          value: isGold ? 0.05 : 0.01,
          color: isGold ? "#FFD700" : `hsl(${Math.random() * 360}, 70%, 60%)`,
          size: isGold ? 12 : 8,
        })
      }
      await supabase.from("game_food_items").insert(foodItems)
    }

    return NextResponse.json({
      success: true,
      player,
      tableId: table.id,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
