import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { tableId, userId, username, message } = await request.json()

    if (!message || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Sanitizar mensaje
    const sanitizedMessage = message.slice(0, 200).trim()

    const { data, error } = await supabase
      .from("game_chat")
      .insert({
        table_id: tableId,
        user_id: userId,
        username,
        message: sanitizedMessage,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Could not send message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get("tableId")

    const query = supabase.from("game_chat").select("*").order("created_at", { ascending: false }).limit(50)

    if (tableId) {
      query.eq("table_id", tableId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Could not fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: data?.reverse() ?? [] })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
