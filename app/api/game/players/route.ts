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

    const { data: players, error } = await supabase
      .from("active_players")
      .select("*")
      .eq("table_id", tableId)
      .eq("is_alive", true)

    if (error) {
      return NextResponse.json({ error: "Could not fetch players" }, { status: 500 })
    }

    return NextResponse.json({ players: players ?? [] })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
