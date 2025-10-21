"use client"

import { MultiplayerWormGame } from "@/components/game/multiplayer-worm-game"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="absolute top-4 left-4 z-50">
        <Button asChild variant="outline" size="sm">
          <Link href="/">← Volver al Inicio</Link>
        </Button>
      </nav>

      {/* Admin Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-6 py-2">
          <h1 className="text-xl font-bold text-primary">🎮 Modo Admin - WormBruh Multijugador</h1>
          <p className="text-xs text-muted-foreground">
            Come puntos para ganar dinero real • Todas las serpientes son jugadores reales
          </p>
        </div>
      </div>

      {/* Multiplayer Worm Game */}
      <MultiplayerWormGame />
    </div>
  )
}
