import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = createClient()

  const CANVAS_WIDTH = 2000
  const CANVAS_HEIGHT = 2000
  const FOOD_COUNT = 50

  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"]

  const foodItems = Array(FOOD_COUNT)
    .fill(null)
    .map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      value: 0.01, // $0.01 per food
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

  const { error } = await supabase.from("game_food").insert(foodItems)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: FOOD_COUNT })
}

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase.from("game_food").select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ food: data })
}
