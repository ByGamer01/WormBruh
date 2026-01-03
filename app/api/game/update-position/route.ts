import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { playerId, x, y, segments, angle, isBoosting, score, currentValue } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: "Missing player ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("active_players")
      .update({
        x,
        y,
        segments,
        angle,
        is_boosting: isBoosting,
        score,
        current_value: currentValue,
        last_updated: new Date().toISOString(),
      })
      .eq("id", playerId)

    if (error) {
      return NextResponse.json({ error: "Could not update position" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
