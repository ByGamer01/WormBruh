import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get("tableId")

    if (!tableId) {
      return NextResponse.json({ error: "Missing table ID" }, { status: 400 })
    }

    const { data: food, error } = await supabase.from("game_food_items").select("*").eq("table_id", tableId)

    if (error) {
      return NextResponse.json({ error: "Could not fetch food" }, { status: 500 })
    }

    return NextResponse.json({ food: food ?? [] })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
