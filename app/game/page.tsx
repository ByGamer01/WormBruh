"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { MultiplayerWormGame } from "@/components/game/multiplayer-worm-game"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GamePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="absolute top-4 left-4 z-50">
          <Button asChild variant="outline" size="sm">
            <Link href="/">← Volver al Inicio</Link>
          </Button>
        </nav>

        {/* Multiplayer Worm Game */}
        <MultiplayerWormGame />
      </div>
    </AuthGuard>
  )
}
