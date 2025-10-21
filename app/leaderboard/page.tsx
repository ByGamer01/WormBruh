"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LeaderboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Tabla de Posiciones</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Inicio</Link>
              </Button>
              <Button asChild>
                <Link href="/game">Jugar</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <LeaderboardTable />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
